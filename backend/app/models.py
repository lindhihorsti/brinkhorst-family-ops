from typing import Optional, List
from uuid import UUID
from sqlmodel import SQLModel, Field
from datetime import datetime
from sqlalchemy import Column, text, DateTime, func, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, ARRAY
from sqlalchemy import String


class Recipe(SQLModel, table=True):
    __tablename__ = "recipes"

    id: Optional[UUID] = Field(
    default=None,
    sa_column=Column(PG_UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")),
)


    title: str
    source_url: Optional[str] = None
    notes: Optional[str] = None
    tags: List[str] = Field(
        default_factory=list,
        sa_column=Column(ARRAY(String), nullable=False, server_default="{}")
    )
    ingredients: List[str] = Field(
        default_factory=list,
        sa_column=Column(ARRAY(String), nullable=False, server_default="{}")
    )
    time_minutes: Optional[int] = None
    difficulty: Optional[int] = None  # 1..3
    is_active: bool = True
    created_by: str = "dennis"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AppState(SQLModel, table=True):
    __tablename__ = "app_state"

    key: str = Field(primary_key=True)
    value: str = Field(sa_column=Column(Text, nullable=False))

    updated_at: datetime | None = Field(
        sa_column=Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    )
