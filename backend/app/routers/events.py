from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import crud, models, schemas, auth, utils
from ..database import get_db

router = APIRouter(prefix="/events", tags=["events"])

@router.post("/", response_model=schemas.EventOut)
def create_event(event: schemas.EventCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return crud.create_event(db=db, owner_id=current_user.id, title=event.title, description=event.description, date=event.date, is_group=event.is_group)

@router.get("/", response_model=List[schemas.EventOut])
def list_my_events(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return crud.list_events_for_user(db, owner_id=current_user.id)

@router.get("/shared", response_model=List[schemas.EventOut])
def list_shared_events(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Find events where viewer_email == current_user.email
    shares = db.query(models.EventShare).filter(models.EventShare.viewer_email == current_user.email).all()
    event_ids = [s.event_id for s in shares]
    events = db.query(models.Event).filter(models.Event.id.in_(event_ids)).all()
    out = []
    for event in events:
        event_out = schemas.EventOut.model_validate(event)
        event_out.owner_name = event.owner.name
        event_out.owner_email = event.owner.email
        out.append(event_out)
    return out

@router.get("/{event_id}", response_model=schemas.EventOut)
def get_event(event_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    event = crud.get_event(db, event_id=event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Check if owner or shared with user
    is_owner = event.owner_id == current_user.id
    if not is_owner:
        share = db.query(models.EventShare).filter(
            models.EventShare.event_id == event_id,
            models.EventShare.viewer_email == current_user.email
        ).first()
        if not share:
            raise HTTPException(status_code=403, detail="Not authorized to view this event")
    
    # Mask reserved_by and add user info
    gifts = []
    for g in event.gifts:
        gift_out = schemas.GiftOut.model_validate(g)
        gift_out.is_reserved = bool(g.reserved_by)
        gift_out.user_name = g.user.name
        gift_out.user_email = g.user.email
        
        # Surprise logic: 
        # If the gift belongs to the current user, they SHOULD NOT see if it's reserved
        if g.user_id == current_user.id:
            gift_out.reserved_by = None
            gift_out.is_reserved = False
        else:
            # Shared user or owner viewing someone else's gift: 
            # If reserved by current user, they see their email
            # If reserved by someone else, they see it is reserved but not by whom
            if g.reserved_by and g.reserved_by != current_user.email:
                gift_out.reserved_by = "RESERVED"
        
        gifts.append(gift_out)
            
    viewers = []
    for s in event.shares:
        user = crud.get_user_by_email(db, s.viewer_email)
        viewers.append(schemas.EventShareOut(
            viewer_email=s.viewer_email,
            viewer_name=user.name if user else None,
            is_registered=user is not None
        ))

    return schemas.EventOut(
        id=event.id,
        title=event.title,
        description=event.description,
        date=event.date,
        owner_id=event.owner_id,
        owner_name=event.owner.name,
        owner_email=event.owner.email,
        is_group=event.is_group,
        gifts=gifts,
        viewers=viewers
    )

@router.put("/{event_id}", response_model=schemas.EventOut)
def update_event(event_id: int, event_update: schemas.EventUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    event = crud.get_event(db, event_id=event_id)
    if not event or event.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Event not found or not authorized")
    return crud.update_event(db, event=event, **event_update.dict(exclude_unset=True))

@router.delete("/{event_id}")
def delete_event(event_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    event = crud.get_event(db, event_id=event_id)
    if not event or event.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Event not found or not authorized")
    
    if event.gifts:
        raise HTTPException(status_code=400, detail="Cannot delete event with gifts")
        
    crud.delete_event(db, event=event)
    return {"detail": "Event deleted"}

@router.post("/{event_id}/shares", response_model=List[schemas.EventShareOut])
def update_shares(event_id: int, share_in: schemas.EventShareIn, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    event = crud.get_event(db, event_id=event_id)
    if not event or event.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Event not found or not authorized")
    
    crud.replace_event_shares(db, event=event, emails=share_in.emails)
    
    # Return enriched shares
    viewers = []
    for email in share_in.emails:
        user = crud.get_user_by_email(db, email)
        viewers.append(schemas.EventShareOut(
            viewer_email=email,
            viewer_name=user.name if user else None,
            is_registered=user is not None
        ))
    return viewers

@router.post("/{event_id}/gifts", response_model=schemas.GiftOut)
async def add_gift(event_id: int, gift: schemas.GiftCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    event = crud.get_event(db, event_id=event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Check if authorized to add gift
    is_owner = event.owner_id == current_user.id
    if not is_owner:
        if not event.is_group:
            raise HTTPException(status_code=403, detail="Only owner can add gifts to a non-group event")
        
        share = db.query(models.EventShare).filter(
            models.EventShare.event_id == event_id,
            models.EventShare.viewer_email == current_user.email
        ).first()
        if not share:
            raise HTTPException(status_code=403, detail="Not authorized to add gifts to this event")
    
    # Get link preview
    preview = {"title": None, "image": None, "description": None}
    if gift.link:
        preview = await utils.get_link_preview(gift.link)

    return crud.add_gift(
        db=db, 
        event_id=event_id, 
        user_id=current_user.id,
        name=gift.name, 
        link=gift.link, 
        notes=gift.notes,
        preview_title=preview.get("title"),
        preview_image=preview.get("image"),
        preview_description=preview.get("description")
    )
