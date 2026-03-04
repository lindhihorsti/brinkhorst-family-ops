from typing import Optional, List, Any, Dict
from uuid import UUID
from sqlmodel import SQLModel, Field
from datetime import datetime, date
from sqlalchemy import Column, text, DateTime, func, Text, Integer, Numeric, Boolean, Date
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, ARRAY, JSONB
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
    # Premium fields
    servings: Optional[int] = Field(default=4)
    rating: Optional[float] = Field(default=None, sa_column=Column(Numeric(2, 1), nullable=True))
    cooked_count: int = Field(default=0)
    photo_url: Optional[str] = None
    nutrition_info: Optional[Dict[str, Any]] = Field(
        default=None, sa_column=Column(JSONB, nullable=True)
    )
    collection_name: Optional[str] = None


class AppState(SQLModel, table=True):
    __tablename__ = "app_state"

    key: str = Field(primary_key=True)
    value: str = Field(sa_column=Column(Text, nullable=False))
    updated_at: datetime | None = Field(
        sa_column=Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    )


class FamilyMember(SQLModel, table=True):
    __tablename__ = "family_members"

    id: Optional[UUID] = Field(
        default=None,
        sa_column=Column(PG_UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")),
    )
    name: str
    color: str = "#888888"
    initials: str = "?"
    telegram_id: Optional[str] = None
    dietary_restrictions: List[str] = Field(
        default_factory=list,
        sa_column=Column(ARRAY(String), nullable=False, server_default="{}")
    )
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)


class MealHistory(SQLModel, table=True):
    __tablename__ = "meal_history"

    id: Optional[UUID] = Field(
        default=None,
        sa_column=Column(PG_UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")),
    )
    recipe_id: UUID = Field(sa_column=Column(PG_UUID(as_uuid=True), nullable=False))
    cooked_on: date = Field(sa_column=Column(Date, nullable=False))
    rating: Optional[float] = Field(default=None, sa_column=Column(Numeric(2, 1), nullable=True))
    cooked_by: Optional[UUID] = Field(default=None, sa_column=Column(PG_UUID(as_uuid=True), nullable=True))
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ChoreTask(SQLModel, table=True):
    __tablename__ = "chore_tasks"

    id: Optional[UUID] = Field(
        default=None,
        sa_column=Column(PG_UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")),
    )
    title: str
    description: Optional[str] = None
    recurrence: str = "weekly"  # daily / weekly / biweekly / monthly
    assigned_to: List[str] = Field(
        default_factory=list,
        sa_column=Column(ARRAY(String), nullable=False, server_default="{}")
    )
    current_idx: int = 0
    points: int = 1
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ChoreCompletion(SQLModel, table=True):
    __tablename__ = "chore_completions"

    id: Optional[UUID] = Field(
        default=None,
        sa_column=Column(PG_UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")),
    )
    chore_id: UUID = Field(sa_column=Column(PG_UUID(as_uuid=True), nullable=False))
    completed_by: UUID = Field(sa_column=Column(PG_UUID(as_uuid=True), nullable=False))
    completed_on: date = Field(
        default_factory=date.today,
        sa_column=Column(Date, nullable=False, server_default=text("CURRENT_DATE"))
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)


class PinboardNote(SQLModel, table=True):
    __tablename__ = "pinboard_notes"

    id: Optional[UUID] = Field(
        default=None,
        sa_column=Column(PG_UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")),
    )
    content: str
    author_id: Optional[UUID] = Field(default=None, sa_column=Column(PG_UUID(as_uuid=True), nullable=True))
    author_name: Optional[str] = None
    tag: str = "allgemein"  # allgemein / schule / einkauf / wichtig / event
    expires_on: Optional[date] = Field(default=None, sa_column=Column(Date, nullable=True))
    photo_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Birthday(SQLModel, table=True):
    __tablename__ = "birthdays"

    id: Optional[UUID] = Field(
        default=None,
        sa_column=Column(PG_UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")),
    )
    name: str
    birth_date: date = Field(sa_column=Column(Date, nullable=False))
    relation: str = "Familie"
    member_id: Optional[UUID] = Field(default=None, sa_column=Column(PG_UUID(as_uuid=True), nullable=True))
    gift_ideas: List[str] = Field(
        default_factory=list,
        sa_column=Column(ARRAY(String), nullable=False, server_default="{}")
    )
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
