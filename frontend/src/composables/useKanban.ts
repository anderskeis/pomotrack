import { computed } from 'vue'
import { useStorage } from './useStorage'

export type KanbanStatus = 'todo' | 'in-progress' | 'done'

export interface KanbanTask {
    id: string
    title: string
    status: KanbanStatus
    pomodorosCompleted: number
    createdAt: number
    completedAt?: number
}

export interface KanbanState {
    tasks: KanbanTask[]
}

const defaultState: KanbanState = {
    tasks: []
}

export function useKanban() {
    const state = useStorage<KanbanState>('kanban', defaultState)

    // Get tasks by status
    const todoTasks = computed(() => 
        state.value.tasks.filter(t => t.status === 'todo')
    )
    
    const inProgressTasks = computed(() => 
        state.value.tasks.filter(t => t.status === 'in-progress')
    )
    
    const doneTasks = computed(() => 
        state.value.tasks.filter(t => t.status === 'done')
    )

    // The active task is the one currently in progress (only one allowed)
    const activeTask = computed(() => 
        state.value.tasks.find(t => t.status === 'in-progress') || null
    )

    // Generate unique ID
    const generateId = () => `task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

    // Add a new task to todo
    const addTask = (title: string) => {
        if (!title.trim()) return

        const newTask: KanbanTask = {
            id: generateId(),
            title: title.trim(),
            status: 'todo',
            pomodorosCompleted: 0,
            createdAt: Date.now()
        }

        state.value.tasks.push(newTask)
    }

    // Move a task to a new status
    const moveTask = (taskId: string, newStatus: KanbanStatus) => {
        const task = state.value.tasks.find(t => t.id === taskId)
        if (!task) return

        // If moving to in-progress, first move any existing in-progress task back to todo
        if (newStatus === 'in-progress') {
            const currentInProgress = state.value.tasks.find(t => t.status === 'in-progress')
            if (currentInProgress && currentInProgress.id !== taskId) {
                currentInProgress.status = 'todo'
            }
        }

        task.status = newStatus

        // Set completedAt when moving to done
        if (newStatus === 'done') {
            task.completedAt = Date.now()
        } else {
            task.completedAt = undefined
        }
    }

    // Delete a task
    const deleteTask = (taskId: string) => {
        const index = state.value.tasks.findIndex(t => t.id === taskId)
        if (index !== -1) {
            state.value.tasks.splice(index, 1)
        }
    }

    // Increment pomodoros on the active (in-progress) task
    const incrementActiveTaskPomodoros = () => {
        const task = state.value.tasks.find(t => t.status === 'in-progress')
        if (task) {
            task.pomodorosCompleted++
        }
    }

    // Clear all done tasks
    const clearDoneTasks = () => {
        state.value.tasks = state.value.tasks.filter(t => t.status !== 'done')
    }

    // Clear all tasks
    const clearAllTasks = () => {
        state.value.tasks = []
    }

    return {
        // State
        tasks: computed(() => state.value.tasks),
        todoTasks,
        inProgressTasks,
        doneTasks,
        activeTask,

        // Actions
        addTask,
        moveTask,
        deleteTask,
        incrementActiveTaskPomodoros,
        clearDoneTasks,
        clearAllTasks
    }
}
