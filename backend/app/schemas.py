from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr


# User
class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    password: Optional[str] = None


class UserOut(UserBase):
    id: int

    class Config:
        from_attributes = True


# Auth
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    email: Optional[EmailStr] = None


# Events
class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    date: Optional[datetime] = None
    is_group: bool = False


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    date: Optional[datetime] = None
    is_group: Optional[bool] = None


# Gifts
class GiftBase(BaseModel):
    name: str
    link: Optional[str] = None
    notes: Optional[str] = None


class GiftCreate(GiftBase):
    pass


class GiftUpdate(BaseModel):
    name: Optional[str] = None
    link: Optional[str] = None
    notes: Optional[str] = None
    reserved_by: Optional[str] = None
    preview_title: Optional[str] = None
    preview_image: Optional[str] = None
    preview_description: Optional[str] = None
    event_id: Optional[int] = None


class GiftOut(GiftBase):
    id: int
    event_id: int
    user_id: int
    reserved_by: Optional[str] = None
    is_reserved: bool = False
    preview_title: Optional[str] = None
    preview_image: Optional[str] = None
    preview_description: Optional[str] = None
    user_name: Optional[str] = None
    user_email: Optional[EmailStr] = None

    class Config:
        from_attributes = True


class EventShareIn(BaseModel):
    emails: List[EmailStr]


class EventShareOut(BaseModel):
    viewer_email: EmailStr
    viewer_name: Optional[str] = None
    is_registered: bool = False

    class Config:
        from_attributes = True


class EventOut(EventBase):
    id: int
    owner_id: int
    owner_name: Optional[str] = None
    owner_email: Optional[EmailStr] = None
    gifts: List[GiftOut] = []
    viewers: List[EventShareOut] = []

    class Config:
        from_attributes = True
