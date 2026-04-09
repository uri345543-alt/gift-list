from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import crud, models, schemas, auth, utils
from ..database import get_db

router = APIRouter(prefix="/gifts", tags=["gifts"])

@router.put("/{gift_id}", response_model=schemas.GiftOut)
async def update_gift(gift_id: int, gift_update: schemas.GiftUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    gift = crud.get_gift(db, gift_id=gift_id)
    if not gift:
        raise HTTPException(status_code=404, detail="Gift not found")
    
    event = crud.get_event(db, event_id=gift.event_id)
    
    # Permission check: who can update this gift?
    # Gift owner can update anything except reserved_by.
    # Others (event owner or viewers) can ONLY update reserved_by.
    
    is_gift_owner = gift.user_id == current_user.id
    is_event_owner = event.owner_id == current_user.id
    
    is_viewer = False
    if not is_event_owner:
        is_viewer = db.query(models.EventShare).filter(
            models.EventShare.event_id == event.id,
            models.EventShare.viewer_email == current_user.email
        ).first() is not None
        if not is_viewer and not is_gift_owner:
            raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = gift_update.dict(exclude_unset=True)
    
    # Logic for reserved_by update
    if "reserved_by" in update_data:
        # Cannot reserve your own gift
        if is_gift_owner and update_data["reserved_by"] is not None:
             raise HTTPException(status_code=400, detail="Cannot reserve your own gift")
        
    if not is_gift_owner:
        # Non-gift owners can only update reserved_by
        if any(k for k in update_data if k not in ["reserved_by"]):
             raise HTTPException(status_code=403, detail="Only gift owner can edit gift details")
    else:
        # Gift owner is editing. 
        # They shouldn't be able to edit reserved_by (it's for others)
        if "reserved_by" in update_data:
            # UNLESS they are unreserving? No, typically others unreserve.
            # But let's keep it simple: gift owner can't see/touch reserved_by.
            del update_data["reserved_by"]

        # If event_id is being changed
        if "event_id" in update_data and update_data["event_id"] != gift.event_id:
            # Check if gift is reserved
            if gift.reserved_by:
                raise HTTPException(status_code=400, detail="Cannot move a reserved gift")
            
            # Check if the target event exists and if they are authorized
            target_event = crud.get_event(db, event_id=update_data["event_id"])
            if not target_event:
                 raise HTTPException(status_code=404, detail="Target event not found")
            
            is_target_event_owner = target_event.owner_id == current_user.id
            is_target_event_viewer = db.query(models.EventShare).filter(
                models.EventShare.event_id == target_event.id,
                models.EventShare.viewer_email == current_user.email
            ).first() is not None
            
            if not is_target_event_owner:
                if not target_event.is_group or not is_target_event_viewer:
                    raise HTTPException(status_code=403, detail="Not authorized to move gift to target event")

        # If link changed, update preview
        if "link" in update_data and update_data["link"] != gift.link:
            if update_data["link"]:
                preview = await utils.get_link_preview(update_data["link"])
                update_data["preview_title"] = preview.get("title")
                update_data["preview_image"] = preview.get("image")
                update_data["preview_description"] = preview.get("description")
            else:
                update_data["preview_title"] = None
                update_data["preview_image"] = None
                update_data["preview_description"] = None
    
    updated_gift = crud.update_gift(db, gift=gift, **update_data)
    
    gift_out = schemas.GiftOut.model_validate(updated_gift)
    gift_out.is_reserved = bool(updated_gift.reserved_by)
    gift_out.user_name = updated_gift.user.name
    gift_out.user_email = updated_gift.user.email
    
    if updated_gift.user_id == current_user.id:
        gift_out.reserved_by = None
        gift_out.is_reserved = False
    elif updated_gift.reserved_by and updated_gift.reserved_by != current_user.email:
        gift_out.reserved_by = "RESERVED"
        
    return gift_out

@router.delete("/{gift_id}")
def delete_gift(gift_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    gift = crud.get_gift(db, gift_id=gift_id)
    if not gift:
        raise HTTPException(status_code=404, detail="Gift not found")
    
    event = crud.get_event(db, event_id=gift.event_id)
    
    # Permission check for deletion
    is_gift_owner = gift.user_id == current_user.id
    is_event_owner = event.owner_id == current_user.id
    
    if not is_gift_owner:
        if not is_event_owner:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        # New requirement: in group events, event owner cannot delete others' gifts
        if event.is_group:
            raise HTTPException(status_code=403, detail="In group events, you cannot delete gifts from other users")
    
    crud.delete_gift(db, gift=gift)
    return {"detail": "Gift deleted"}
