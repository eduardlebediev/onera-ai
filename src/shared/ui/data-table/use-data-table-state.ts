"use client"

import { useCallback, useMemo } from "react"
import type { OnChangeFn, PaginationState, SortingState } from "@tanstack/react-table"
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs"

const DEFAULT_PAGE = 1

function parseSortParam(sort: string): SortingState {
  const [id, direction] = sort.split(".")

  if (!id || (direction !== "asc" && direction !== "desc")) {
    return []
  }

  return [{ id, desc: direction === "desc" }]
}

function serializeSortingState(sorting: SortingState): string {
  const [sort] = sorting

  if (!sort) {
    return ""
  }

  return `${sort.id}.${sort.desc ? "desc" : "asc"}`
}

interface UseDataTableStateOptions {
  pageSize: number
}

export function useDataTableState({ pageSize }: UseDataTableStateOptions) {
  const [queryState, setQueryState] = useQueryStates(
    {
      page: parseAsInteger.withDefault(DEFAULT_PAGE),
      sort: parseAsString.withDefault(""),
      search: parseAsString.withDefault(""),
    },
    {
      history: "replace",
      shallow: true,
    }
  )

  const sorting = useMemo(() => parseSortParam(queryState.sort), [queryState.sort])
  const pagination = useMemo<PaginationState>(
    () => ({
      pageIndex: Math.max(queryState.page, DEFAULT_PAGE) - 1,
      pageSize,
    }),
    [pageSize, queryState.page]
  )

  const setSearch = useCallback(
    (search: string) => {
      void setQueryState({ search, page: DEFAULT_PAGE })
    },
    [setQueryState]
  )

  const onSortingChange = useCallback<OnChangeFn<SortingState>>(
    (updaterOrValue) => {
      const nextSorting =
        typeof updaterOrValue === "function" ? updaterOrValue(sorting) : updaterOrValue

      void setQueryState({
        sort: serializeSortingState(nextSorting),
        page: DEFAULT_PAGE,
      })
    },
    [setQueryState, sorting]
  )

  const onPaginationChange = useCallback<OnChangeFn<PaginationState>>(
    (updaterOrValue) => {
      const nextPagination =
        typeof updaterOrValue === "function" ? updaterOrValue(pagination) : updaterOrValue

      void setQueryState({ page: nextPagination.pageIndex + 1 })
    },
    [pagination, setQueryState]
  )

  return {
    search: queryState.search,
    setSearch,
    sorting,
    onSortingChange,
    pagination,
    onPaginationChange,
  }
}
