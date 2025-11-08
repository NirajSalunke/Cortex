-- DropIndex
DROP INDEX "KanbanCard_boardId_position_column_key";

-- CreateIndex
CREATE INDEX "KanbanCard_boardId_column_position_idx" ON "KanbanCard"("boardId", "column", "position");
