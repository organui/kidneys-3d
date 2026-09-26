import * as React from "react"
import { Button } from "@base-ui/react/button"

export type AnatomyNode = {
  id: string
  label: string
  children?: readonly AnatomyNode[]
}
export type AnatomyTreeProps = {
  data: readonly AnatomyNode[]
  selectedId: string | null
  onSelectionChange: (id: string) => void
  /** Missing IDs are visible. Branches summarize their leaf descendants. */
  visibility: Readonly<Record<string, boolean>>
  onVisibilityChange: (visibility: Record<string, boolean>) => void
  defaultExpandedIds?: readonly string[]
  label?: string
  className?: string
}

export function anatomyIndex(data: readonly AnatomyNode[]) {
  const nodes = new Map<string, AnatomyNode>()
  const parents = new Map<string, string>()
  function visit(items: readonly AnatomyNode[], parent?: string) {
    for (const node of items) {
      if (!node.id || nodes.has(node.id))
        throw new Error("Anatomy IDs must be nonempty and unique")
      nodes.set(node.id, node)
      if (parent) parents.set(node.id, parent)
      visit(node.children ?? [], node.id)
    }
  }
  visit(data)
  return { nodes, parents }
}

export function leafIds(node: AnatomyNode): string[] {
  return node.children?.length ? node.children.flatMap(leafIds) : [node.id]
}

export function visibilityState(
  node: AnatomyNode,
  visibility: Readonly<Record<string, boolean>>,
): boolean | "mixed" {
  const values = leafIds(node).map((id) => visibility[id] !== false)
  return values.every(Boolean) ? true : values.some(Boolean) ? "mixed" : false
}

export function AnatomyTree({
  data,
  selectedId,
  onSelectionChange,
  visibility,
  onVisibilityChange,
  defaultExpandedIds = [],
  label = "Anatomy",
  className = "",
}: AnatomyTreeProps) {
  const { nodes, parents } = anatomyIndex(data)
  const [expanded, setExpanded] = React.useState(
    () => new Set(defaultExpandedIds),
  )
  const [query, setQuery] = React.useState("")
  const [activePath, setActivePath] = React.useState<string[]>(() =>
    data[0] ? [data[0].id] : [],
  )
  const root = React.useRef<HTMLDivElement>(null)
  const search = React.useRef<HTMLInputElement>(null)
  const hadFocus = React.useRef(false)
  const refs = React.useRef(new Map<string, HTMLDivElement>())
  const helpId = React.useId()
  const searchId = React.useId()
  const term = query.trim().toLocaleLowerCase()
  const included = new Set<string>()
  if (term)
    for (const node of nodes.values()) {
      if (node.label.toLocaleLowerCase().includes(term)) {
        let id: string | undefined = node.id
        while (id) {
          included.add(id)
          id = parents.get(id)
        }
      }
    }
  const rows: {
    node: AnatomyNode
    level: number
    size: number
    position: number
  }[] = []
  function flatten(items: readonly AnatomyNode[], level: number) {
    const visible = items.filter((n) => !term || included.has(n.id))
    visible.forEach((node, index) => {
      rows.push({ node, level, size: visible.length, position: index + 1 })
      if (term || expanded.has(node.id)) flatten(node.children ?? [], level + 1)
    })
  }
  flatten(data, 1)
  let focusId: string | undefined = activePath[0]
  while (focusId && !rows.some(({ node }) => node.id === focusId))
    focusId = parents.get(focusId)
  focusId ??=
    activePath.find((id) => rows.some(({ node }) => node.id === id)) ??
    rows[0]?.node.id
  React.useLayoutEffect(() => {
    if (hadFocus.current && !root.current?.contains(document.activeElement)) {
      if (focusId) refs.current.get(focusId)?.focus()
      else search.current?.focus()
    }
  })
  function focus(id?: string) {
    if (id) {
      refs.current.get(id)?.focus()
    }
  }
  function toggleExpanded(id: string) {
    setExpanded((previous) => {
      const next = new Set(previous)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  function toggleVisibility(node: AnatomyNode) {
    const next = new Map(
      [...nodes.keys()]
        .filter((id) => Object.hasOwn(visibility, id))
        .map((id) => [id, visibility[id]!] as const),
    )
    const value = visibilityState(node, visibility) !== true
    for (const id of leafIds(node)) next.set(id, value)
    onVisibilityChange(Object.fromEntries(next))
  }
  return (
    <section
      className={`rounded-xl border bg-background p-4 text-foreground ${className}`}
    >
      <label htmlFor={searchId} className="mb-2 block text-sm font-medium">
        Search {label.toLocaleLowerCase()}
      </label>
      <input
        ref={search}
        id={searchId}
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="mb-3 w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-ring"
      />
      <p id={helpId} className="mb-3 text-xs text-muted-foreground">
        Arrows navigate and expand. Enter selects. Space toggles visibility.
      </p>
      <div
        ref={root}
        role="tree"
        aria-label={label}
        aria-describedby={helpId}
        onFocusCapture={() => {
          hadFocus.current = true
        }}
        onBlurCapture={(event) => {
          if (
            event.relatedTarget &&
            !event.currentTarget.contains(event.relatedTarget as Node)
          )
            hadFocus.current = false
        }}
      >
        {rows.map(({ node, level, size, position }, index) => {
          const branch = !!node.children?.length
          const open = !!term || expanded.has(node.id)
          const checked = visibilityState(node, visibility)
          return (
            <div
              key={node.id}
              ref={(element) => {
                if (element) refs.current.set(node.id, element)
                else refs.current.delete(node.id)
              }}
              role="treeitem"
              aria-label={node.label}
              aria-level={level}
              aria-setsize={size}
              aria-posinset={position}
              aria-expanded={branch ? open : undefined}
              aria-selected={selectedId === node.id}
              aria-checked={checked}
              tabIndex={focusId === node.id ? 0 : -1}
              onFocus={() => {
                const path = [node.id]
                let parent = parents.get(node.id)
                while (parent) {
                  path.push(parent)
                  parent = parents.get(parent)
                }
                setActivePath(path)
              }}
              onKeyDown={(event) => {
                if (
                  ![
                    "ArrowDown",
                    "ArrowUp",
                    "ArrowRight",
                    "ArrowLeft",
                    "Home",
                    "End",
                    "Enter",
                    " ",
                  ].includes(event.key)
                )
                  return
                event.preventDefault()
                if (event.key === "ArrowDown") focus(rows[index + 1]?.node.id)
                if (event.key === "ArrowUp") focus(rows[index - 1]?.node.id)
                if (event.key === "Home") focus(rows[0]?.node.id)
                if (event.key === "End") focus(rows.at(-1)?.node.id)
                if (event.key === "ArrowRight" && branch) {
                  if (!open) toggleExpanded(node.id)
                  else if (rows[index + 1]?.level === level + 1)
                    focus(rows[index + 1]?.node.id)
                }
                if (event.key === "ArrowLeft") {
                  if (branch && open && !term) toggleExpanded(node.id)
                  else focus(parents.get(node.id))
                }
                if (event.key === "Enter") onSelectionChange(node.id)
                if (event.key === " ") toggleVisibility(node)
              }}
              className="my-1 flex min-h-10 items-center gap-1 rounded-md px-2 text-sm outline-offset-2 hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring aria-selected:bg-accent aria-selected:font-semibold"
              style={{ paddingInlineStart: `${(level - 1) * 1.25 + 0.5}rem` }}
            >
              {branch ? (
                <Button
                  tabIndex={-1}
                  aria-label={`${open ? "Collapse" : "Expand"} ${node.label}`}
                  disabled={!!term}
                  onClick={() => {
                    focus(node.id)
                    toggleExpanded(node.id)
                  }}
                  className="size-8 shrink-0 rounded hover:bg-accent"
                >
                  {open ? "−" : "+"}
                </Button>
              ) : (
                <span className="w-8 shrink-0" />
              )}
              <Button
                tabIndex={-1}
                onClick={() => {
                  focus(node.id)
                  onSelectionChange(node.id)
                }}
                className="min-w-0 flex-1 py-2 text-start break-words"
              >
                {node.label}
              </Button>
              <Button
                tabIndex={-1}
                aria-label={`${checked === true ? "Hide" : "Show"} ${node.label}`}
                onClick={() => {
                  focus(node.id)
                  toggleVisibility(node)
                }}
                className="shrink-0 rounded border px-2 py-1 text-xs"
              >
                {checked === "mixed" ? "Mixed" : checked ? "Visible" : "Hidden"}
              </Button>
            </div>
          )
        })}
      </div>
      {!rows.length && (
        <p role="status" className="py-4 text-sm text-muted-foreground">
          {data.length ? "No matching anatomy." : "No anatomy available."}
        </p>
      )}
    </section>
  )
}
