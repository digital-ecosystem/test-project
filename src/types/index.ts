export interface Session {
    id: string
    userId: string
    status: SessionStatus
    token: string
    expiresAt: string
    createdAt: string
    updatedAt: string
    user: User
}

export interface User {
    id: string
    email: string
    name: string
    isActive: boolean
    createdAt: string
    updatedAt: string
    sessionStatus: SessionStatus // Optional, if not always present
}

export enum SessionStatus {
    DRAFT = "DRAFT",
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED"
}

export interface Question {
    id: string
    text: string
    createdAt: string
    options: Option[]
}

export interface Option {
    id: string
    questionId: string
    label: string
    value: string
    createdAt: string
}

export interface UserUpdate {
    first_name: string
    last_name: string
    age: number
}

export interface DashboardQuestions {
    id: number
    text: string
    options: Option[]
    selectedValue: string
  }
  
  export interface Option {
    label: string
    value: string
  }