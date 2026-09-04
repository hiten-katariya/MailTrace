"""Phase 5 schema: add attachments table

Revision ID: 0003_attachments
Revises: 0002_phase2
Create Date: 2026-09-04 18:45:00

"""
from alembic import op
import sqlalchemy as sa

revision = '0003_attachments'
down_revision = '0002_phase2'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table(
        'attachments',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('case_id', sa.String(36), sa.ForeignKey('cases.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('filename', sa.String(500), nullable=False),
        sa.Column('declared_content_type', sa.String(128), nullable=True),
        sa.Column('detected_file_type', sa.String(128), nullable=True),
        sa.Column('file_size', sa.Integer(), default=0, nullable=True),
        sa.Column('file_hash', sa.String(64), nullable=True, index=True),
        sa.Column('is_flagged', sa.Boolean(), default=False, nullable=False),
        sa.Column('flag_reason', sa.Text(), nullable=True),
    )

def downgrade() -> None:
    op.drop_table('attachments')
