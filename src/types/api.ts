export interface PaginatedResult<T> {
  count: number,
  next: string | null,
  previous: string | null,
  results: T[]
}


export interface ErrorMessage {
  message: string
}
