"""Phase 2 schema: nlp_findings, urls, geolocation, domain_intel, ip_reputation_cache

Revision ID: 0002_phase2
Revises: 0001_phase1
Create Date: 2026-09-02 17:05:00

"""
from alembic import op
import sqlalchemy as sa

revision = '0002_phase2'
down_revision = '0001_phase1'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # 6. nlp_findings
    op.create_table(
        'nlp_findings',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('case_id', sa.String(36), sa.ForeignKey('cases.id', ondelete='CASCADE'), unique=True, nullable=False, index=True),
        sa.Column('classification', sa.String(32), default='legitimate', nullable=False),
        sa.Column('classification_confidence', sa.Float(), default=0.0, nullable=False),
        sa.Column('sentiment_urgency_score', sa.Integer(), default=0, nullable=True),
        sa.Column('impersonation_target', sa.String(128), nullable=True),
        sa.Column('flagged_phrases', sa.JSON(), nullable=False),
        sa.Column('bec_indicators', sa.JSON(), nullable=False),
    )

    # 7. urls
    op.create_table(
        'urls',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('case_id', sa.String(36), sa.ForeignKey('cases.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('original_url', sa.Text(), nullable=False),
        sa.Column('resolved_url', sa.Text(), nullable=True),
        sa.Column('domain', sa.String(255), nullable=True),
        sa.Column('is_flagged', sa.Boolean(), default=False),
        sa.Column('reason', sa.String(255), nullable=True),
        sa.Column('redirect_hops', sa.Integer(), default=0),
        sa.Column('status_code', sa.Integer(), nullable=True),
    )

    # 8. geolocation
    op.create_table(
        'geolocation',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('case_id', sa.String(36), sa.ForeignKey('cases.id', ondelete='CASCADE'), unique=True, nullable=False, index=True),
        sa.Column('originating_ip', sa.String(64), nullable=False, index=True),
        sa.Column('country', sa.String(128), nullable=True),
        sa.Column('region', sa.String(128), nullable=True),
        sa.Column('city', sa.String(128), nullable=True),
        sa.Column('latitude', sa.Float(), nullable=True),
        sa.Column('longitude', sa.Float(), nullable=True),
        sa.Column('precision_confidence', sa.String(64), default='country: high, city: low', nullable=False),
        sa.Column('isp', sa.String(255), nullable=True),
        sa.Column('asn', sa.String(64), nullable=True),
    )

    # 9. domain_intel
    op.create_table(
        'domain_intel',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('case_id', sa.String(36), sa.ForeignKey('cases.id', ondelete='CASCADE'), unique=True, nullable=False, index=True),
        sa.Column('domain', sa.String(255), nullable=False, index=True),
        sa.Column('registrar', sa.String(255), nullable=True),
        sa.Column('registered_on', sa.String(64), nullable=True),
        sa.Column('domain_age_days', sa.Integer(), nullable=True),
        sa.Column('registrant_country', sa.String(64), nullable=True),
        sa.Column('mx_valid', sa.Boolean(), default=False),
        sa.Column('raw_whois', sa.Text(), nullable=True),
    )

    # 10. ip_reputation_cache
    op.create_table(
        'ip_reputation_cache',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('ip', sa.String(64), unique=True, nullable=False, index=True),
        sa.Column('abuse_score', sa.Integer(), default=0, nullable=True),
        sa.Column('is_vpn_tor', sa.Boolean(), default=False),
        sa.Column('flag_source', sa.String(64), default='AbuseIPDB', nullable=True),
        sa.Column('isp', sa.String(255), nullable=True),
        sa.Column('cached_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
    )

def downgrade() -> None:
    op.drop_table('ip_reputation_cache')
    op.drop_table('domain_intel')
    op.drop_table('geolocation')
    op.drop_table('urls')
    op.drop_table('nlp_findings')
