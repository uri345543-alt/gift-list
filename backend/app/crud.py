from typing import List, Optional
from sqlalchemy.orm import Session

from . import models


def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.email == email).first()


def create_user(db: Session, email: str, hashed_password: str, name: str | None = None) -> models.User:
    user = models.User(email=email, hashed_password=hashed_password, name=name)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_user(db: Session, user: models.User, **kwargs) -> models.User:
    for k, v in kwargs.items():
        setattr(user, k, v)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def create_event(db: Session, owner_id: int, title: str, description: str | None, date, is_group: bool = False) -> models.Event:
    event = models.Event(owner_id=owner_id, title=title, description=description, date=date, is_group=is_group)
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


def list_events_for_user(db: Session, owner_id: int) -> List[models.Event]:
    return db.query(models.Event).filter(models.Event.owner_id == owner_id).all()


def get_event(db: Session, event_id: int) -> Optional[models.Event]:
    return db.query(models.Event).filter(models.Event.id == event_id).first()


def update_event(db: Session, event: models.Event, **kwargs) -> models.Event:
    for k, v in kwargs.items():
        setattr(event, k, v)
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


def delete_event(db: Session, event: models.Event) -> None:
    db.delete(event)
    db.commit()


def add_gift(db: Session, event_id: int, user_id: int, name: str, link: str | None, notes: str | None, preview_title: str | None = None, preview_image: str | None = None, preview_description: str | None = None) -> models.Gift:
    gift = models.Gift(
        event_id=event_id, 
        user_id=user_id,
        name=name, 
        link=link, 
        notes=notes,
        preview_title=preview_title,
        preview_image=preview_image,
        preview_description=preview_description
    )
    db.add(gift)
    db.commit()
    db.refresh(gift)
    return gift


def list_gifts(db: Session, event_id: int) -> List[models.Gift]:
    return db.query(models.Gift).filter(models.Gift.event_id == event_id).all()


def get_gift(db: Session, gift_id: int) -> Optional[models.Gift]:
    return db.query(models.Gift).filter(models.Gift.id == gift_id).first()


def update_gift(db: Session, gift: models.Gift, **kwargs) -> models.Gift:
    for k, v in kwargs.items():
        setattr(gift, k, v)
    db.add(gift)
    db.commit()
    db.refresh(gift)
    return gift


def delete_gift(db: Session, gift: models.Gift) -> None:
    db.delete(gift)
    db.commit()


def replace_event_shares(db: Session, event: models.Event, emails: List[str]) -> List[models.EventShare]:
    # Clear existing
    db.query(models.EventShare).filter(models.EventShare.event_id == event.id).delete()
    db.commit()
    # Add new
    shares = []
    for e in emails:
        share = models.EventShare(event_id=event.id, viewer_email=e)
        db.add(share)
        shares.append(share)
    db.commit()
    for s in shares:
        db.refresh(s)
    return shares


def list_event_shares(db: Session, event_id: int) -> List[models.EventShare]:
    return db.query(models.EventShare).filter(models.EventShare.event_id == event_id).all()
