"""Phase 6 schema: gmail_message_id on cases, auto_trash_on_purge on retention_policy, gmail_accounts table

Revision ID: 0004_gmail_trash_and_message_id
Revises: 0003_attachments
Create Date: 2026-09-05 16:30:00

"""
from alembic import op
import sqlalchemy as sa

revision = '0004_gmail_trash_and_message_id'
down_revision = '0003_attachments'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # 1. Ensure gmail_accounts table exists
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = inspector.get_table_names()

    if 'gmail_accounts' not in existing_tables:
        op.create_table(
            'gmail_accounts',
            sa.Column('id', sa.String(36), primary_key=True),
            sa.Column('gmail_address', sa.String(255), unique=True, nullable=False, index=True),
            sa.Column('encrypted_refresh_token', sa.Text(), nullable=False),
            sa.Column('scopes_granted', sa.String(500), nullable=True),
            sa.Column('last_history_id', sa.String(64), nullable=True),
            sa.Column('connected_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('last_polled_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('status', sa.String(32), default='active', nullable=False),
            sa.Column('error_message', sa.Text(), nullable=True),
        )

    # 2. Add columns to cases table if not present
    case_columns = [col['name'] for col in inspector.get_columns('cases')]
    if 'source' not in case_columns:
        op.add_column('cases', sa.Column('source', sa.String(32), server_default='upload', nullable=False))
        op.create_index('ix_cases_source', 'cases', ['source'])

    if 'gmail_account' not in case_columns:
        op.add_column('cases', sa.Column('gmail_account', sa.String(255), nullable=True))
        op.create_index('ix_cases_gmail_account', 'cases', ['gmail_account'])

    if 'gmail_message_id' not in case_columns:
        op.add_column('cases', sa.Column('gmail_message_id', sa.String(128), nullable=True))
        op.create_index('ix_cases_gmail_message_id', 'cases', ['gmail_message_id'])

    # 3. Add auto_trash_on_purge to retention_policy if not present
    if 'retention_policy' in existing_tables:
        retention_columns = [col['name'] for col in inspector.get_columns('retention_policy')]
        if 'auto_trash_on_purge' not in retention_columns:
            op.add_column('retention_policy', sa.Column('auto_trash_on_purge', sa.Boolean(), server_default=sa.false(), nullable=False))

def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = inspector.get_table_names()

    if 'retention_policy' in existing_tables:
        retention_columns = [col['name'] for col in inspector.get_columns('retention_policy')]
        if 'auto_trash_on_purge' in retention_columns:
            op.drop_column('retention_policy', 'auto_trash_on_purge')

    if 'cases' in existing_tables:
        case_columns = [col['name'] for col in inspector.get_columns('cases')]
        if 'gmail_message_id' in case_columns:
            try:
                op.drop_index('ix_cases_gmail_message_id', table_name='cases')
            except Exception:
                pass
            op.drop_column('cases', 'gmail_message_id')

        if 'gmail_account' in case_columns:
            try:
                op.drop_index('ix_cases_gmail_account', table_name='cases')
            except Exception:
                pass
            op.drop_column('cases', 'gmail_account')

        if 'source' in case_columns:
            try:
                op.drop_index('ix_cases_source', table_name='cases')
            except Exception:
                pass
            op.drop_column('cases', 'source')

    if 'gmail_accounts' in existing_tables:
        op.drop_table('gmail_accounts')
