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
import { Plus, GripVertical, Trash2, Loader2, Edit2, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// TYPE DEFINITIONS
interface Card {
  id: string;
  title: string;
  description?: string;
  column: string;
  position: number;
  assignee?: any;
  assigneeId?: string;
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
  onCreateCard: (card: Partial<Card>) => Promise<void>;
  onDeleteCard: (cardId: string) => Promise<void>;
  projectId: string;
  boardId: string;
}

function CardDetailsDialog({
  cardId,
  open,
  onOpenChange,
  projectId,
  boardId,
}: {
  cardId: string;
  open: boolean;
  onOpenChange: (val: boolean) => void;
  projectId: string;
  boardId: string;
}) {
  const queryClient = useQueryClient();

  // Fetch fresh card data from API (optional, or use locally)
  const { data: card, isLoading } = useQuery({
    queryKey: ["card", cardId],
    queryFn: async () => {
      const res = await fetch(
        `/api/projects/${projectId}/boards/${boardId}/cards/${cardId}`
      );
      if (!res.ok) throw new Error("Failed to fetch card");
      return res.json();
    },
    enabled: open,
  });

  // Edit mode
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<Partial<Card>>({});
  React.useEffect(() => {
    if (card && open) {
      setForm({
        title: card.title,
        description: card.description || "",
        dueDate: card.dueDate || "",
        assigneeId: card.assignee?.id || "",
      });
      setEditMode(false);
    }
  }, [card, open]);

  const updateCardMutation = useMutation({
    mutationFn: async (updates: Partial<Card>) => {
      const res = await fetch(
        `/api/projects/${projectId}/boards/${boardId}/cards/${cardId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        }
      );
      if (!res.ok) throw new Error("Failed to update card");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["card", cardId], data);
      queryClient.invalidateQueries({
        queryKey: ["board", projectId, boardId],
      });
      setEditMode(false);
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editMode ? "Edit Card Details" : "Card Details"}
          </DialogTitle>
          <DialogDescription>
            View and edit all details for this card.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          card && (
            <>
              {editMode ? (
                <form
                  className="space-y-6"
                  onSubmit={(e) => {
                    e.preventDefault();
                    updateCardMutation.mutate(form);
                  }}
                >
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Title
                    </label>
                    <Input
                      value={form.title || ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, title: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Description
                    </label>
                    <textarea
                      aria-label="description"
                      value={form.description || ""}
                      rows={4}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, description: e.target.value }))
                      }
                      className="w-full border rounded p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Due Date
                    </label>
                    <Input
                      type="date"
                      value={form.dueDate ? form.dueDate.slice(0, 10) : ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, dueDate: e.target.value }))
                      }
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      type="submit"
                      disabled={updateCardMutation.isPending}
                    >
                      {updateCardMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        "Save"
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditMode(false)}
                    >
                      Cancel
                    </Button>
                  </DialogFooter>
                </form>
              ) : (
                <>
                  <div className="mb-4">
                    <div className="text-lg font-semibold">{card.title}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {card?.description || (
                        <span className="italic">No description</span>
                      )}
                    </div>
                  </div>
                  <div className="mb-2 flex items-center text-sm gap-4">
                    <span>
                      <span className="font-medium">Due:</span>{" "}
                      {card?.dueDate ? (
                        new Date(card.dueDate).toLocaleDateString()
                      ) : (
                        <span className="italic text-muted-foreground">
                          No due date
                        </span>
                      )}
                    </span>
                    <span>
                      <span className="font-medium">Assignee:</span>{" "}
                      {card?.assignee?.name || (
                        <span className="italic text-muted-foreground">
                          None
                        </span>
                      )}
                    </span>
                  </div>
                  <DialogFooter>
                    <Button onClick={() => setEditMode(true)}>
                      <Edit2 className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <DialogClose asChild>
                      <Button variant="outline">Close</Button>
                    </DialogClose>
                  </DialogFooter>
                </>
              )}
            </>
          )
        )}
      </DialogContent>
    </Dialog>
  );
}

// --- KANBAN CARD COMPONENT --
function KanbanCard({
  card,
  onDelete,
  isDeleting,
  isOverlay = false,
  onDialogOpen,
}: {
  card: Card;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  isOverlay?: boolean;
  onDialogOpen?: (id: string) => void;
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

  // ⚡ Card is now clickable to open dialog
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-background border border-border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow group cursor-pointer"
      onClick={() => onDialogOpen?.(card.id)}
    >
      {/* drag handle */}
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
          onClick={(e) => {
            e.stopPropagation();
            onDelete(card.id);
          }}
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

// COLUMN COMPONENT
function Column({
  column,
  cards,
  onCreateCard,
  onDeleteCard,
  projectId,
  boardId,
}: ColumnProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newCard, setNewCard] = useState({ title: "", description: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);

  // Dialog state
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

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
    if (!newCard.title.trim()) return;
    setIsLoading(true);
    try {
      await onCreateCard({
        title: newCard.title,
        description: newCard.description,
        column,
      });
      setNewCard({ title: "", description: "" });
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
                onDialogOpen={(id) => setSelectedCard(id)}
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
                value={newCard.title}
                onChange={(e) =>
                  setNewCard((card) => ({ ...card, title: e.target.value }))
                }
                disabled={isLoading}
                autoFocus
                className="text-sm mb-2"
              />
              <textarea
                placeholder="Description..."
                value={newCard.description}
                onChange={(e) =>
                  setNewCard((card) => ({
                    ...card,
                    description: e.target.value,
                  }))
                }
                className="text-sm w-full border rounded p-2 mb-2"
                rows={2}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleCreateCard}
                  disabled={!newCard.title.trim() || isLoading}
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
                    setNewCard({ title: "", description: "" });
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
      {selectedCard && (
        <CardDetailsDialog
          cardId={selectedCard}
          open={!!selectedCard}
          onOpenChange={(open) => {
            if (!open) setSelectedCard(null);
          }}
          projectId={projectId}
          boardId={boardId}
        />
      )}
    </div>
  );
}

// --- MAIN KANBAN BOARD ---
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

  // CREATE (with title/desc now)
  const createCardMutation = useMutation({
    mutationFn: async ({
      title,
      description,
      column,
    }: {
      title?: string;
      description?: string;
      column?: string;
    }) => {
      const res = await fetch(
        `/api/projects/${projectId}/boards/${boardId}/cards`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            column,
            position: 0,
          }),
        }
      );
      if (!res.ok) throw new Error("Failed to create card");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["board", projectId, boardId],
      });
    },
  });

  // DELETE
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
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["board", projectId, boardId],
      });
    },
  });

  // MOVE
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
    onSuccess: () => {
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
    if (overData?.type === "Column") {
      const newColumn = overData.column;
      moveCardMutation.mutate({
        cardId: activeCard.id,
        newColumn: newColumn,
        newPosition: 0,
      });
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
              onCreateCard={(card) => createCardMutation.mutateAsync(card)}
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
