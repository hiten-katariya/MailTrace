"""Phase 1 initial schema: users, cases, headers, relay_hops, audit_log

Revision ID: 0001_phase1
Revises: 
Create Date: 2026-09-02 17:00:00

"""
from alembic import op
import sqlalchemy as sa

revision = '0001_phase1'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # 1. users
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('username', sa.String(64), unique=True, nullable=False, index=True),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('full_name', sa.String(128), nullable=True),
        sa.Column('role', sa.String(32), default='analyst'),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # 2. cases
    op.create_table(
        'cases',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('file_hash', sa.String(64), nullable=False, index=True),
        sa.Column('raw_file_path', sa.String(255), nullable=False),
        sa.Column('subject', sa.String(500), nullable=False),
        sa.Column('sender', sa.String(255), nullable=False),
        sa.Column('sender_domain', sa.String(255), nullable=True, index=True),
        sa.Column('recipient', sa.String(255), nullable=True),
        sa.Column('received_at', sa.DateTime(timezone=True), nullable=False, index=True),
        sa.Column('submitted_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('status', sa.String(32), default='processing', index=True),
        sa.Column('pipeline_progress', sa.JSON(), nullable=False),
        sa.Column('fraud_score', sa.Integer(), nullable=True, index=True),
        sa.Column('risk_category', sa.String(32), nullable=True, index=True),
        sa.Column('confidence', sa.String(16), nullable=True),
        sa.Column('verdict_summary', sa.Text(), nullable=True),
        sa.Column('score_breakdown', sa.JSON(), nullable=True),
    )

    # 3. headers
    op.create_table(
        'headers',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('case_id', sa.String(36), sa.ForeignKey('cases.id', ondelete='CASCADE'), unique=True, nullable=False, index=True),
        sa.Column('spf_result', sa.String(32), default='none', nullable=False),
        sa.Column('spf_record', sa.Text(), nullable=True),
        sa.Column('spf_sender_ip', sa.String(64), nullable=True),
        sa.Column('dkim_result', sa.String(32), default='none', nullable=False),
        sa.Column('dkim_domain', sa.String(255), nullable=True),
        sa.Column('dkim_selector', sa.String(64), nullable=True),
        sa.Column('dkim_signature_present', sa.Boolean(), default=False),
        sa.Column('dmarc_result', sa.String(32), default='none', nullable=False),
        sa.Column('dmarc_policy', sa.String(32), nullable=True),
        sa.Column('dmarc_disposition', sa.String(32), nullable=True),
        sa.Column('anomalies', sa.JSON(), nullable=False),
        sa.Column('raw_headers', sa.Text(), nullable=True),
    )

    # 4. relay_hops
    op.create_table(
        'relay_hops',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('case_id', sa.String(36), sa.ForeignKey('cases.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('hop_number', sa.Integer(), nullable=False),
        sa.Column('ip', sa.String(64), nullable=False),
        sa.Column('server', sa.String(255), nullable=True),
        sa.Column('by_server', sa.String(255), nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=True),
        sa.Column('delay_ms', sa.Integer(), nullable=True, default=0),
        sa.Column('spf_status', sa.String(32), nullable=True),
        sa.Column('country', sa.String(64), nullable=True),
        sa.Column('is_earliest_origin', sa.Boolean(), default=False),
    )

    # 5. audit_log
    op.create_table(
        'audit_log',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.func.now(), index=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('username', sa.String(64), nullable=False),
        sa.Column('action', sa.String(64), nullable=False),
        sa.Column('case_id', sa.String(36), nullable=True, index=True),
        sa.Column('details', sa.Text(), nullable=True),
        sa.Column('ip_address', sa.String(64), nullable=True),
    )

def downgrade() -> None:
    op.drop_table('audit_log')
    op.drop_table('relay_hops')
    op.drop_table('headers')
    op.drop_table('cases')
    op.drop_table('users')
