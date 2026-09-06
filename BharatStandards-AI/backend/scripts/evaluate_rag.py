"""
BharatStandards AI - RAG Evaluation Script
Automated benchmark evaluating retrieval success, source relevance, and answer availability
across a 10-question compliance dataset.
"""
import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base
from app.models.user import User
from app.models.product import Product
from app.models.document import Document, DocumentChunk
from app.models.compliance import ComplianceReport, Gap
from app.models.standard import Standard, Requirement
from app.services.standards_seed import seed_standards_knowledge_base
from app.services.ai_service import AIService

# In-memory test db for evaluation
eval_engine = create_engine("sqlite:///:memory:")
Base.metadata.create_all(bind=eval_engine)
Session = sessionmaker(bind=eval_engine)
session = Session()

# 1. Seed standards
seed_standards_knowledge_base(session)

# 2. Seed test user, product, document, and compliance report
user = User(name="Eval User", email="eval@bharatstandards.in", password_hash="dummy", role="industry")
session.add(user)
session.commit()

product = Product(
    user_id=user.id,
    name="Electric Water Heater 25L",
    category="Electrical Appliances",
    manufacturer="Bharat Heaters Ltd",
    model_number="EWH-2500",
    description="Stationary electric storage water heater 230V 2000W",
    technical_details="2000W rated wattage, 25 liter capacity, 1.6 MPa proof pressure.",
)
session.add(product)
session.commit()

doc = Document(
    user_id=user.id,
    product_id=product.id,
    filename="eval_doc_01.pdf",
    original_filename="EWH-Safety-Test-Report-2026.pdf",
    file_type="PDF",
    storage_path="/dummy/path",
    status="PROCESSED",
)
session.add(doc)
session.commit()

chunk1 = DocumentChunk(
    document_id=doc.id,
    chunk_index=0,
    page=3,
    section="Electrical Safety & Earthing",
    char_count=180,
    content="Insulation resistance measured at 500 V DC: 18.4 MΩ (Threshold: ≥ 2.0 MΩ). Earth resistance: 0.04 Ω (Threshold: ≤ 0.1 Ω). Status: PASS.",
)
chunk2 = DocumentChunk(
    document_id=doc.id,
    chunk_index=1,
    page=2,
    section="Rated Input Wattage",
    char_count=160,
    content="Measured wattage: 1980 W against rated 2000 W (-1.0% deviation, allowed ± 5%). Status: PASS.",
)
session.add_all([chunk1, chunk2])

std = session.query(Standard).filter(Standard.standard_number == "DEMO-IS-001").first()
rep = ComplianceReport(
    user_id=user.id,
    product_id=product.id,
    standard_id=std.id,
    score=78.0,
    status="COMPLETED",
    total_requirements=20,
    passed_count=15,
    partial_count=3,
    missing_count=2,
    summary="78% Compliance Readiness",
)
session.add(rep)
session.commit()

req84 = session.query(Requirement).filter(Requirement.standard_id == std.id, Requirement.clause == "8.4").first()
if req84:
    gap = Gap(
        report_id=rep.id,
        requirement_id=req84.id,
        priority="CRITICAL",
        description="Hydrostatic proof test at 1.6 MPa absent from uploaded report.",
        recommended_action="Schedule hydrostatic burst pressure test at NABL accredited lab.",
    )
    session.add(gap)
    session.commit()

# Evaluation Dataset (10 questions)
EVALUATION_DATASET = [
    {
        "id": 1,
        "question": "Which standard may apply to an electric water heater?",
        "expected_source": "DEMO-IS-001",
        "expected_topic": "STANDARD_DISCOVERY",
        "key_phrases": ["DEMO-IS-001", "electric water heater"],
    },
    {
        "id": 2,
        "question": "What evidence is required for electrical safety under Clause 6.1?",
        "expected_source": "Clause 6.1",
        "expected_topic": "REQUIREMENT_EXPLANATION",
        "key_phrases": ["insulation resistance", "earthing"],
    },
    {
        "id": 3,
        "question": "Which requirements are currently missing for my electric water heater?",
        "expected_source": "Clause 8.4",
        "expected_topic": "COMPLIANCE_QUESTION",
        "key_phrases": ["78", "gap", "missing"],
    },
    {
        "id": 4,
        "question": "What does clause 4.1 mean regarding marking and rating plates?",
        "expected_source": "Clause 4.1",
        "expected_topic": "REQUIREMENT_EXPLANATION",
        "key_phrases": ["marking", "rating plate", "voltage"],
    },
    {
        "id": 5,
        "question": "Does my uploaded report contain relevant evidence for electrical insulation?",
        "expected_source": "EWH-Safety-Test-Report-2026.pdf",
        "expected_topic": "DOCUMENT_QUESTION",
        "key_phrases": ["insulation", "500 v", "pass"],
    },
    {
        "id": 6,
        "question": "What hydrostatic proof pressure must the container withstand?",
        "expected_source": "Clause 8.4",
        "expected_topic": "REQUIREMENT_EXPLANATION",
        "key_phrases": ["1.6 mpa", "pressure", "hydrostatic"],
    },
    {
        "id": 7,
        "question": "What are the markings required on an electric storage water heater?",
        "expected_source": "Clause 4.1",
        "expected_topic": "REQUIREMENT_EXPLANATION",
        "key_phrases": ["rated capacity", "voltage", "standard mark"],
    },
    {
        "id": 8,
        "question": "Which BIS certification scheme applies to household electrical appliances?",
        "expected_source": "DEMO-IS-001",
        "expected_topic": "BIS_SERVICE_GUIDANCE",
        "key_phrases": ["scheme-i", "isi mark", "laboratory"],
    },
    {
        "id": 9,
        "question": "What thermal cut-out safety requirements are specified under Clause 10.2?",
        "expected_source": "Clause 10.2",
        "expected_topic": "REQUIREMENT_EXPLANATION",
        "key_phrases": ["thermal cut-out", "safety", "90"],
    },
    {
        "id": 10,
        "question": "What should I do next to resolve my open compliance gaps?",
        "expected_source": "Clause 8.4",
        "expected_topic": "COMPLIANCE_QUESTION",
        "key_phrases": ["nabl", "burst test", "hydrostatic"],
    },
]

def run_evaluation():
    print("==================================================================")
    print("BharatStandards AI - RAG Evaluation Benchmark (10 Questions)")
    print("==================================================================\n")

    ai_service = AIService(session)

    total = len(EVALUATION_DATASET)
    retrieval_successes = 0
    source_relevance_hits = 0
    answer_availabilities = 0

    for item in EVALUATION_DATASET:
        q_id = item["id"]
        q_text = item["question"]
        expected_src = item["expected_source"].lower()
        key_phrases = [k.lower() for k in item["key_phrases"]]

        # Run RAG
        result = ai_service.answer_question(
            user_id=user.id,
            question=q_text,
            product_id=product.id,
        )

        sources = result["sources"]
        answer = result["answer"].lower()

        # 1. Retrieval Success (Retrieved at least one relevant chunk/standard)
        has_retrieval = len(sources) > 0
        if has_retrieval:
            retrieval_successes += 1

        # 2. Source Relevance Hit (Expected source present in citations)
        src_hit = any(expected_src in (s["title"].lower() + " " + str(s.get("clause", "")).lower()) for s in sources)
        if src_hit:
            source_relevance_hits += 1

        # 3. Answer Availability (Answer is grounded and contains key domain terms)
        has_answer = len(answer) > 50 and any(k in answer for k in key_phrases)
        if has_answer:
            answer_availabilities += 1

        status_flag = "PASS" if (has_retrieval and src_hit and has_answer) else "PARTIAL"
        print(f"[{status_flag}] Q{q_id:02d}: \"{q_text}\"")
        print(f"       Sources: {len(sources)} | Top Score: {sources[0]['relevance_score'] if sources else 0.0} | Confidence: {result['confidence']}")
        print(f"       Expected Source: \"{item['expected_source']}\" (Hit: {src_hit})")
        print()

    print("------------------------------------------------------------------")
    print("EVALUATION RESULTS SUMMARY:")
    print(f"- Total Test Questions:      {total}")
    print(f"- Retrieval Success Rate:    {(retrieval_successes / total) * 100:.1f}% ({retrieval_successes}/{total})")
    print(f"- Source Relevance Hit Rate: {(source_relevance_hits / total) * 100:.1f}% ({source_relevance_hits}/{total})")
    print(f"- Answer Availability Rate:  {(answer_availabilities / total) * 100:.1f}% ({answer_availabilities}/{total})")
    print("------------------------------------------------------------------")
    print("Notice: Benchmark performed on a curated 10-question evaluation dataset.")
    print("Does not represent exhaustive production domain coverage.")
    print("==================================================================")

if __name__ == "__main__":
    run_evaluation()
