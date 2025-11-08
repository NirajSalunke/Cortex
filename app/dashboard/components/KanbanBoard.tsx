"use client";

import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, GripVertical, Trash2, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface Card {
  id: string;
  title: string;
  description?: string;
  column: string;
  position: number;
  assignee?: any;
  dueDate?: string;
}

interface KanbanBoardProps {
  board: any;
  projectId: string;
  boardId: string;
}

interface ColumnProps {
  column: string;
  cards: Card[];
  onCreateCard: (column: string, title: string) => Promise<void>;
  onDeleteCard: (cardId: string) => Promise<void>;
  projectId: string;
  boardId: string;
}

// ==================== KANBAN CARD COMPONENT ====================

function KanbanCard({
  card,
  onDelete,
  isDeleting,
  isOverlay = false,
}: {
  card: Card;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  isOverlay?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: {
      type: "Card",
      card,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (isOverlay) {
    return (
      <div className="bg-background border border-border rounded-lg p-4 shadow-lg rotate-3">
        <div className="flex items-start gap-2">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm line-clamp-2 mb-2">
              {card.title}
            </h3>
            {card.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                {card.description}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-background border border-border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow group"
    >
      <div className="flex items-start gap-2">
        <div
          {...listeners}
          {...attributes}
          className="cursor-grab active:cursor-grabbing pt-1"
        >
          <GripVertical className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm line-clamp-2 mb-2">
            {card.title}
          </h3>
          {card.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
              {card.description}
            </p>
          )}

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              {card.assignee && (
                <div
                  className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-white text-xs font-bold"
                  title={card.assignee.name}
                >
                  {card.assignee.name?.substring(0, 1).toUpperCase()}
                </div>
              )}
            </div>
            {card.dueDate && (
              <span className="text-muted-foreground">
                {new Date(card.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => onDelete(card.id)}
          disabled={isDeleting}
          className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 transition-opacity disabled:opacity-50"
        >
          {isDeleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}

// ==================== COLUMN COMPONENT ====================

function Column({
  column,
  cards,
  onCreateCard,
  onDeleteCard,
  projectId,
  boardId,
}: ColumnProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);

  // ✅ Make the column droppable
  const { setNodeRef, isOver } = useDroppable({
    id: column,
    data: {
      type: "Column",
      column,
    },
  });

  const cardIds = useMemo(() => cards.map((card) => card.id), [cards]);

  const handleCreateCard = async () => {
    if (!newCardTitle.trim()) return;

    setIsLoading(true);
    try {
      await onCreateCard(column, newCardTitle);
      setNewCardTitle("");
      setIsCreating(false);
    } catch (error) {
      console.error("Error creating card:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    setDeletingCardId(cardId);
    try {
      await onDeleteCard(cardId);
    } finally {
      setDeletingCardId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">{column}</h2>
        <span className="text-xs bg-muted px-2 py-1 rounded font-medium">
          {cards.length}
        </span>
      </div>

      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`space-y-2 min-h-96 bg-muted/30 rounded-lg p-4 border-2 border-dashed transition-colors ${
            isOver
              ? "border-primary bg-primary/10"
              : "border-muted-foreground/20 hover:border-muted-foreground/40"
          }`}
        >
          {cards.length > 0 ? (
            cards.map((card) => (
              <KanbanCard
                key={card.id}
                card={card}
                onDelete={handleDeleteCard}
                isDeleting={deletingCardId === card.id}
              />
            ))
          ) : (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              {isOver ? "Drop here" : "No cards yet"}
            </div>
          )}

          {isCreating ? (
            <div className="space-y-2 bg-background rounded-lg p-3 border border-border">
              <Input
                placeholder="Card title..."
                value={newCardTitle}
                onChange={(e) => setNewCardTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isLoading) {
                    handleCreateCard();
                  }
                  if (e.key === "Escape") {
                    setIsCreating(false);
                    setNewCardTitle("");
                  }
                }}
                disabled={isLoading}
                autoFocus
                className="text-sm"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleCreateCard}
                  disabled={!newCardTitle.trim() || isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create"
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false);
                    setNewCardTitle("");
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full py-2 px-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border border-transparent hover:border-border flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add card
            </button>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

// ==================== MAIN KANBAN BOARD ====================

export function KanbanBoard({ board, projectId, boardId }: KanbanBoardProps) {
  const queryClient = useQueryClient();
  const [activeCard, setActiveCard] = useState<Card | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const createCardMutation = useMutation({
    mutationFn: async ({
      column,
      title,
    }: {
      column: string;
      title: string;
    }) => {
      const res = await fetch(
        `/api/projects/${projectId}/boards/${boardId}/cards`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            column,
            position: 0,
          }),
        }
      );

      if (!res.ok) throw new Error("Failed to create card");
      return res.json();
    },
    onMutate: async ({ column, title }) => {
      await queryClient.cancelQueries({
        queryKey: ["board", projectId, boardId],
      });

      const previousBoard = queryClient.getQueryData([
        "board",
        projectId,
        boardId,
      ]);

      queryClient.setQueryData(["board", projectId, boardId], (old: any) => {
        if (!old) return old;

        const tempId = `temp-${Date.now()}`;
        const newCard = {
          id: tempId,
          title,
          column,
          position: 0,
          description: null,
          assignee: null,
          dueDate: null,
          createdAt: new Date().toISOString(),
        };

        return {
          ...old,
          cards: [newCard, ...old.cards],
        };
      });

      return { previousBoard };
    },
    onError: (err, variables, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(
          ["board", projectId, boardId],
          context.previousBoard
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["board", projectId, boardId],
      });
    },
  });

  const deleteCardMutation = useMutation({
    mutationFn: async (cardId: string) => {
      const res = await fetch(
        `/api/projects/${projectId}/boards/${boardId}/cards/${cardId}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) throw new Error("Failed to delete card");
      return res.json();
    },
    onMutate: async (cardId) => {
      await queryClient.cancelQueries({
        queryKey: ["board", projectId, boardId],
      });

      const previousBoard = queryClient.getQueryData([
        "board",
        projectId,
        boardId,
      ]);

      queryClient.setQueryData(["board", projectId, boardId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          cards: old.cards.filter((card: Card) => card.id !== cardId),
        };
      });

      return { previousBoard };
    },
    onError: (err, variables, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(
          ["board", projectId, boardId],
          context.previousBoard
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["board", projectId, boardId],
      });
    },
  });

  const moveCardMutation = useMutation({
    mutationFn: async ({
      cardId,
      newColumn,
      newPosition,
    }: {
      cardId: string;
      newColumn: string;
      newPosition: number;
    }) => {
      const res = await fetch(
        `/api/projects/${projectId}/boards/${boardId}/cards/${cardId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            column: newColumn,
            position: newPosition,
          }),
        }
      );

      if (!res.ok) throw new Error("Failed to move card");
      return res.json();
    },
    onMutate: async ({ cardId, newColumn, newPosition }) => {
      await queryClient.cancelQueries({
        queryKey: ["board", projectId, boardId],
      });

      const previousBoard = queryClient.getQueryData([
        "board",
        projectId,
        boardId,
      ]);

      queryClient.setQueryData(["board", projectId, boardId], (old: any) => {
        if (!old) return old;

        const updatedCards = old.cards.map((card: Card) => {
          if (card.id === cardId) {
            return { ...card, column: newColumn, position: newPosition };
          }
          return card;
        });

        return { ...old, cards: updatedCards };
      });

      return { previousBoard };
    },
    onError: (err, variables, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(
          ["board", projectId, boardId],
          context.previousBoard
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["board", projectId, boardId],
      });
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeData = active.data.current;

    if (activeData?.type === "Card") {
      setActiveCard(activeData.card);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (!activeData || activeData.type !== "Card") return;

    const activeCard = activeData.card;
    const allCards = board?.cards || [];

    // ✅ Dragging over another card
    if (overData?.type === "Card") {
      const overCard = overData.card;

      if (activeCard.column !== overCard.column) {
        const overColumnCards = allCards.filter(
          (c: Card) => c.column === overCard.column
        );
        const overIndex = overColumnCards.findIndex(
          (c: Card) => c.id === overId
        );

        moveCardMutation.mutate({
          cardId: activeCard.id,
          newColumn: overCard.column,
          newPosition: overIndex,
        });
      }
    }

    // ✅ Dragging over an empty column
    if (overData?.type === "Column") {
      const newColumn = overData.column;

      if (activeCard.column !== newColumn) {
        moveCardMutation.mutate({
          cardId: activeCard.id,
          newColumn: newColumn,
          newPosition: 0,
        });
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCard(null);

    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (!activeData || activeData.type !== "Card") return;

    const activeCard = activeData.card;
    const allCards = board?.cards || [];

    // Dragging over another card
    if (overData?.type === "Card") {
      const overCard = overData.card;
      const overColumnCards = allCards.filter(
        (c: Card) => c.column === overCard.column
      );
      const overIndex = overColumnCards.findIndex((c: Card) => c.id === overId);

      moveCardMutation.mutate({
        cardId: activeCard.id,
        newColumn: overCard.column,
        newPosition: overIndex,
      });
    }

    // Dragging over a column
    if (overData?.type === "Column") {
      const newColumn = overData.column;

      moveCardMutation.mutate({
        cardId: activeCard.id,
        newColumn: newColumn,
        newPosition: 0,
      });
    }
  };

  const allCardIds = useMemo(
    () => (board?.cards || []).map((c: any) => c.id),
    [board?.cards]
  );

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(board?.columns || []).map((column: string) => {
          const cardsInColumn = (board?.cards || [])
            .filter((card: any) => card.column === column)
            .sort((a: Card, b: Card) => a.position - b.position);

          return (
            <Column
              key={column}
              column={column}
              cards={cardsInColumn}
              onCreateCard={(col, title) =>
                createCardMutation.mutateAsync({ column: col, title })
              }
              onDeleteCard={(cardId) => deleteCardMutation.mutateAsync(cardId)}
              projectId={projectId}
              boardId={boardId}
            />
          );
        })}
      </div>

      {typeof window !== "undefined" &&
        createPortal(
          <DragOverlay>
            {activeCard ? (
              <KanbanCard
                card={activeCard}
                onDelete={() => {}}
                isDeleting={false}
                isOverlay
              />
            ) : null}
          </DragOverlay>,
          document.body
        )}
    </DndContext>
  );
}

export default KanbanBoard;
