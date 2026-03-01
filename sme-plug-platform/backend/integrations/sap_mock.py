from typing import Dict, List, Any
import datetime

# Mock SAP ERP Data for 3 separate tenants to demonstrate isolation
SAP_DATABASE: Dict[str, Dict[str, Any]] = {
    "buildco": {
        "tenant_name": "BuildCo Construction",
        "kpis": {
            "total_inventory_value": "$4.2M",
            "open_pos": 14,
            "stock_alerts": 2
        },
        "materials": [
            {"id": "MAT-8992", "name": "Type II Steel Rebar", "stock": 450, "unit": "Tons", "status": "Healthy"},
            {"id": "MAT-8993", "name": "Portland Cement v2", "stock": 12, "unit": "Pallets", "status": "Critical"},
            {"id": "MAT-8994", "name": "Structural Timber", "stock": 880, "unit": "Boards", "status": "Healthy"}
        ],
        "pos": [
            {"id": "PO-2026-881", "vendor": "Global Steel LLC", "amount": "$145,000", "delivery": "Oct 12, 2026", "status": "In Transit"},
            {"id": "PO-2026-882", "vendor": "CementCo Inc", "amount": "$22,000", "delivery": "Oct 15, 2026", "status": "Processing"}
        ]
    },
    "hospital": {
        "tenant_name": "City General Hospital",
        "kpis": {
            "total_inventory_value": "$1.8M",
            "open_pos": 42,
            "stock_alerts": 1
        },
        "materials": [
            {"id": "MED-110", "name": "Surgical Masks (N95)", "stock": 5000, "unit": "Boxes", "status": "Healthy"},
            {"id": "MED-111", "name": "IV Saline Bags 500ml", "stock": 45, "unit": "Units", "status": "Critical"},
            {"id": "MED-112", "name": "Sterile Gauze Pads", "stock": 1200, "unit": "Packs", "status": "Healthy"}
        ],
        "pos": [
            {"id": "PO-MED-991", "vendor": "PharmaSupply+", "amount": "$45,200", "delivery": "Oct 10, 2026", "status": "In Transit"},
            {"id": "PO-MED-992", "vendor": "MedEquip Direct", "amount": "$8,500", "delivery": "Oct 11, 2026", "status": "Delayed"}
        ]
    },
    "lawfirm": {
        "tenant_name": "Pearson Specter Litt",
        "kpis": {
            "total_inventory_value": "$45K",
            "open_pos": 3,
            "stock_alerts": 0
        },
        "materials": [
            {"id": "OFF-001", "name": "Legal Pad Boxes (Yellow)", "stock": 120, "unit": "Boxes", "status": "Healthy"},
            {"id": "OFF-002", "name": "Printer Toner 89X", "stock": 15, "unit": "Cartridges", "status": "Healthy"},
            {"id": "OFF-003", "name": "Bond Paper A4", "stock": 300, "unit": "Reams", "status": "Healthy"}
        ],
        "pos": [
            {"id": "PO-LEG-101", "vendor": "Office Depot Corporate", "amount": "$1,200", "delivery": "Oct 14, 2026", "status": "Processing"}
        ]
    }
}

def get_tenant_data(tenant_id: str) -> Dict[str, Any]:
    """Return raw mock data for a specified tenant, defaulting to buildco if unknown."""
    return SAP_DATABASE.get(tenant_id, SAP_DATABASE["buildco"])

def build_sap_context(tenant_id: str) -> str:
    """
    Format the raw ERP data into a text string that can be injected
    directly into the LLM system prompt for context grounding.
    """
    data = get_tenant_data(tenant_id)
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    ctx = f"--- LIVE SAP ERP DATA (Synced: {now}) ---\n"
    ctx += f"Tenant: {data['tenant_name']}\n"
    ctx += f"Total Inventory Value: {data['kpis']['total_inventory_value']}\n"
    ctx += f"Open Purchase Orders: {data['kpis']['open_pos']}\n\n"
    
    ctx += "MATERIALS INVENTORY:\n"
    for m in data["materials"]:
        ctx += f"- {m['id']}: {m['name']} | {m['stock']} {m['unit']} ({m['status']})\n"
        
    ctx += "\nOPEN PURCHASE ORDERS:\n"
    for p in data["pos"]:
        ctx += f"- {p['id']} to {p['vendor']} | {p['amount']} | Expected: {p['delivery']} ({p['status']})\n"
        
    ctx += "---------------------------------------\n"
    ctx += "When answering the user, refer to these exact IDs and quantities if relevant to their question.\n"
    
    return ctx
