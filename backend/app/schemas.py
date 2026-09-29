from pydantic import BaseModel


class DemoLogin(BaseModel):
    role: str
    first_name: str = "Demo"
    last_name: str = "User"


class MaxInitData(BaseModel):
    init_data: str


class MaxRegistration(MaxInitData):
    first_name: str
    last_name: str
    phone: str = ""
    auth_provider: str = "phone"


class BuildingCreate(BaseModel):
    name: str
    address: str
    description: str = ""
    apartments_count: int = 0


class JoinBuilding(BaseModel):
    building_id: int
    apartment_number: str = ""
    relation: str = "resident"


class HouseJoin(BaseModel):
    apartment_number: str = ""
    relation: str = "resident"


class RequestCreate(BaseModel):
    building_id: int
    category: str
    description: str


class RequestStatus(BaseModel):
    status: str


class RequestUpdate(BaseModel):
    category: str | None = None
    description: str | None = None


class MeterSubmit(BaseModel):
    value: str


class EventResolve(BaseModel):
    resolved: bool = True


class HousePostCreate(BaseModel):
    title: str
    body: str
    post_type: str = "announcement"
    important: bool = False


class NewsCreate(BaseModel):
    building_id: int
    title: str
    body: str
    important: bool = False


class SubscriptionCreate(BaseModel):
    building_id: int
    type: str
    enabled: bool = True
