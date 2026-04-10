from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_group = Column(Boolean, default=False)

    events = relationship("Event", back_populates="owner", cascade="all, delete-orphan")


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    date = Column(DateTime, default=datetime.utcnow)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    is_group = Column(Boolean, default=False)

    owner = relationship("User", back_populates="events")
    gifts = relationship("Gift", back_populates="event", cascade="all, delete-orphan")
    shares = relationship("EventShare", back_populates="event", cascade="all, delete-orphan")


class Gift(Base):
    __tablename__ = "gifts"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    link = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    reserved_by = Column(String, nullable=True)  # email of reserver
    
    # Preview metadata
    preview_title = Column(String, nullable=True)
    preview_image = Column(String, nullable=True)
    preview_description = Column(String, nullable=True)

    event = relationship("Event", back_populates="gifts")
    user = relationship("User")


class EventShare(Base):
    __tablename__ = "event_shares"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False, index=True)
    viewer_email = Column(String, index=True, nullable=False)

    event = relationship("Event", back_populates="shares")
