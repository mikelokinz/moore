from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from app.services.moordyn_service import moordyn_service

router = APIRouter(prefix="/physics", tags=["Physics Engine"])


class MooringSimRequest(BaseModel):
    water_depth: float = Field(default=1000.0, ge=10.0, le=6000.0, description="Ocean depth in meters")
    scope_ratio: float = Field(default=1.25, ge=1.05, le=2.0, description="Mooring line scope ratio (length / depth)")
    excursion_x: float = Field(default=24.5, description="Buoy surge excursion X in meters")
    excursion_z: float = Field(default=18.2, description="Buoy sway excursion Z in meters")
    wave_height: float = Field(default=2.2, ge=0.1, le=15.0, description="Significant wave height Hs in meters")
    wave_period: float = Field(default=8.5, ge=2.0, le=25.0, description="Peak wave period Tp in seconds")
    current_speed: float = Field(default=0.85, ge=0.0, le=4.0, description="Surface current velocity in m/s")
    material_type: str = Field(default="wire", description="Mooring material ('wire', 'chain', 'nylon')")
    line_diameter: float = Field(default=0.024, description="Line nominal diameter in meters")
    mbl_kN: float = Field(default=450.0, description="Minimum Breaking Load in kN")
    submerged_weight_N_m: float = Field(default=24.5, description="Submerged weight in N/m")
    elastic_modulus_GPa: float = Field(default=110.0, description="Young's modulus in GPa")
    num_segments: int = Field(default=20, ge=5, le=50, description="Lumped-mass nodes count")


@router.get("/status")
def get_physics_status() -> Dict[str, Any]:
    """Returns status and version of backend & frontend physics engines."""
    return moordyn_service.get_status()


@router.post("/moordyn/simulate")
def run_moordyn_simulation(req: MooringSimRequest) -> Dict[str, Any]:
    """
    Executes MoorDyn v2 Dynamic Lumped-Mass Mooring Simulation.
    Returns 3D catenary node positions, fairlead tension, anchor pull, and DAF.
    """
    try:
        result = moordyn_service.simulate_mooring(
            water_depth=req.water_depth,
            scope_ratio=req.scope_ratio,
            excursion_x=req.excursion_x,
            excursion_z=req.excursion_z,
            wave_height=req.wave_height,
            wave_period=req.wave_period,
            current_speed=req.current_speed,
            material_type=req.material_type,
            line_diameter=req.line_diameter,
            mbl_kN=req.mbl_kN,
            submerged_weight_N_m=req.submerged_weight_N_m,
            elastic_modulus_GPa=req.elastic_modulus_GPa,
            num_segments=req.num_segments,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation error: {str(e)}")
