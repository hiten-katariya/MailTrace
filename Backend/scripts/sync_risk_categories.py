import sys
import os
import asyncio

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
try:
    import Backend
    sys.modules["backend"] = Backend
except Exception:
    pass

from backend.app.database import AsyncSessionLocal
from backend.app.models.case import Case
from backend.app.models.content import NLPFinding
from backend.app.core.scoring import get_risk_category
from sqlalchemy import select


async def fix_all_cases():
    async with AsyncSessionLocal() as session:
        res = await session.execute(select(Case))
        cases = res.scalars().all()
        updated = 0
        for c in cases:
            cres = await session.execute(select(NLPFinding).where(NLPFinding.case_id == c.id))
            cont = cres.scalars().first()
            bec_ind = cont.bec_indicators if cont else []
            classif = cont.classification if cont else None
            new_cat = get_risk_category(c.fraud_score or 0, bec_ind, classif)
            if c.risk_category != new_cat:
                print(f"Updating Case {c.id}: score={c.fraud_score} from '{c.risk_category}' -> '{new_cat}'")
                c.risk_category = new_cat
                updated += 1
        await session.commit()
        print(f"Successfully synchronized {updated} cases in database.")


if __name__ == "__main__":
    asyncio.run(fix_all_cases())
