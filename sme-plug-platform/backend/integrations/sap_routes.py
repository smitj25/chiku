from fastapi import APIRouter, Query
from backend.integrations.sap_mock import get_tenant_data

sap_router = APIRouter(tags=["integrations_sap"])

@sap_router.get("/materials")
async def get_materials(tenant_id: str = Query("buildco")):
    data = get_tenant_data(tenant_id)
    return {"materials": data["materials"]}

@sap_router.get("/pos")
async def get_pos(tenant_id: str = Query("buildco")):
    data = get_tenant_data(tenant_id)
    return {"pos": data["pos"]}

@sap_router.get("/kpis")
async def get_kpis(tenant_id: str = Query("buildco")):
    data = get_tenant_data(tenant_id)
    return {
        "tenant_name": data["tenant_name"],
        "kpis": data["kpis"]
    }
