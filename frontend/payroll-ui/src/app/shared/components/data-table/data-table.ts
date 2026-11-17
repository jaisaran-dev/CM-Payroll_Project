// src/app/shared/components/data-table/data-table.ts
import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  Directive,
  ElementRef,
  HostListener,
  TemplateRef,
  computed,
  contentChildren,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Checkbox } from '../checkbox/checkbox';
import { Icon } from '../icon/icon';
import { TABLE_IMPORTS } from '../table/table';

export type SortDirection = 'asc' | 'desc' | null;
export type RowKey = string | number;

export interface DataTableColumn<T> {
  key: string;
  header: string;
  accessor?: (row: T) => string | number | null | undefined;
  /** Value used when sorting. Defaults to row[key]. */
  sortValue?: (row: T) => string | number;
  sortable?: boolean;
  className?: string; // extra classes for the header cell
  cellClassName?: string; // extra classes for body cells
}

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
  defaultValue?: string[];
}

/**
 * Custom cell content for one column:
 *   <ng-template appCell="name" let-row> ...{{ row.name }}... </ng-template>
 */
@Directive({ selector: 'ng-template[appCell]', standalone: true })
export class DataTableCell {
  name = input.required<string>({ alias: 'appCell' });
  template = inject(TemplateRef);
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [NgTemplateOutlet, Icon, Checkbox, ...TABLE_IMPORTS],
  templateUrl: './data-table.html',
})
export class DataTable<T> {
  // ---- Inputs ----
  data = input.required<T[]>();
  columns = input.required<DataTableColumn<T>[]>();
  keyExtractor = input.required<(row: T) => RowKey>();

  searchKeys = input<string[]>([]);
  searchPlaceholder = input('Search...');
  filters = input<FilterConfig[]>([]);
  selectable = input(true);
  pageSize = input(10);
  isLoading = input(false);
  emptyMessage = input('No results found.');
  addName = input('Add New');
  actionColumnHeader = input('Actions');

  canAdd = input(false);
  canView = input(false);
  canEdit = input(false);
  canDelete = input(false);

  enableSearch = input(true);
  enableFilter = input(true);
  enableColumnVisibility = input(true);

  // ---- Outputs ----
  add = output<void>();
  viewRow = output<T>();
  editRow = output<T>();
  deleteRow = output<T>();
  selectionChange = output<RowKey[]>();

  // ---- Custom cell templates + dropdown refs ----
  private cellTemplates = contentChildren(DataTableCell);
  private colMenuRef = viewChild<ElementRef<HTMLElement>>('colMenu');
  private filterMenuRef = viewChild<ElementRef<HTMLElement>>('filterMenu');

  // ---- State ----
  search = signal('');
  sortKey = signal<string | null>(null);
  sortDir = signal<SortDirection>(null);
  selected = signal<ReadonlySet<RowKey>>(new Set());
  hiddenCols = signal<ReadonlySet<string>>(new Set());
  colMenuOpen = signal(false);
  filterMenuOpen = signal(false);
  page = signal(0);
  private filterSelections = signal<Record<string, string[]>>({});

  // ---- Derived data ----
  templateMap = computed(
    () =>
      new Map(
        this.cellTemplates().map((c): [string, TemplateRef<unknown>] => [c.name(), c.template]),
      ),
  );

  hasRowActions = computed(() => this.canView() || this.canEdit() || this.canDelete());

  visibleColumns = computed(() => this.columns().filter((c) => !this.hiddenCols().has(c.key)));

  colSpan = computed(
    () =>
      this.visibleColumns().length + (this.selectable() ? 1 : 0) + (this.hasRowActions() ? 1 : 0),
  );

  private filtered = computed(() => {
    let result = this.data();

    const q = this.search().trim().toLowerCase();
    const keys = this.searchKeys();
    if (q && keys.length > 0) {
      result = result.filter((row) =>
        keys.some((k) =>
          String(this.field(row, k) ?? '')
            .toLowerCase()
            .includes(q),
        ),
      );
    }

    for (const f of this.filters()) {
      const chosen = this.selectionFor(f.key);
      if (chosen.length > 0) {
        result = result.filter((row) => chosen.includes(String(this.field(row, f.key) ?? '')));
      }
    }
    return result;
  });

  sorted = computed(() => {
    const key = this.sortKey();
    const dir = this.sortDir();
    const rows = this.filtered();
    if (!key || !dir) return rows;

    const col = this.columns().find((c) => c.key === key);
    const getVal = col?.sortValue ?? ((r: T) => this.field(r, key) as string | number);

    return [...rows].sort((a, b) => {
      const av = getVal(a);
      const bv = getVal(b);
      const result =
        typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av ?? '').localeCompare(String(bv ?? ''));
      return dir === 'asc' ? result : -result;
    });
  });

  pageCount = computed(() => Math.max(1, Math.ceil(this.sorted().length / this.pageSize())));
  currentPage = computed(() => Math.min(this.page(), this.pageCount() - 1));

  pageRows = computed(() => {
    const start = this.currentPage() * this.pageSize();
    return this.sorted().slice(start, start + this.pageSize());
  });

  /** Page buttons. A value of -1 means an ellipsis ("..."). */
  pageNumbers = computed(() => {
    const total = this.pageCount();
    const cur = this.currentPage();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i);

    const wanted = new Set([0, total - 1, cur - 1, cur, cur + 1]);
    const sorted = [...wanted].filter((p) => p >= 0 && p < total).sort((a, b) => a - b);

    const result: number[] = [];
    sorted.forEach((p, i) => {
      if (i > 0 && p - sorted[i - 1] > 1) result.push(-1);
      result.push(p);
    });
    return result;
  });

  allSelected = computed(() => {
    const ids = this.pageRows().map(this.keyExtractor());
    return ids.length > 0 && ids.every((id) => this.selected().has(id));
  });

  someSelected = computed(() => {
    const ids = this.pageRows().map(this.keyExtractor());
    return ids.some((id) => this.selected().has(id)) && !this.allSelected();
  });

  totalActiveFilters = computed(() =>
    this.filters().reduce((sum, f) => sum + this.selectionFor(f.key).length, 0),
  );

  activePills = computed(() =>
    this.filters().flatMap((f) =>
      this.selectionFor(f.key).map((value) => ({
        key: f.key,
        value,
        text: `${f.label}: ${f.options.find((o) => o.value === value)?.label ?? value}`,
      })),
    ),
  );

  // ---- Close dropdowns when clicking outside ----
  @HostListener('document:mousedown', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node;
    if (!this.colMenuRef()?.nativeElement.contains(target)) this.colMenuOpen.set(false);
    if (!this.filterMenuRef()?.nativeElement.contains(target)) this.filterMenuOpen.set(false);
  }

  // ---- Template helpers ----
  cellValue(col: DataTableColumn<T>, row: T): unknown {
    return col.accessor ? col.accessor(row) : this.field(row, col.key);
  }

  rowKey(row: T): RowKey {
    return this.keyExtractor()(row);
  }

  isSelected(row: T): boolean {
    return this.selected().has(this.rowKey(row));
  }

  selectionFor(key: string): string[] {
    const chosen = this.filterSelections()[key];
    if (chosen) return chosen;
    return this.filters().find((f) => f.key === key)?.defaultValue ?? [];
  }

  isFilterChecked(key: string, value: string): boolean {
    return this.selectionFor(key).includes(value);
  }

  isColumnVisible(key: string): boolean {
    return !this.hiddenCols().has(key);
  }

  // ---- Actions ----
  onSearch(value: string): void {
    this.search.set(value);
    this.page.set(0);
  }

  toggleSort(key: string): void {
    if (this.sortKey() !== key) {
      this.sortKey.set(key);
      this.sortDir.set('asc');
    } else if (this.sortDir() === 'asc') {
      this.sortDir.set('desc');
    } else {
      this.sortKey.set(null);
      this.sortDir.set(null);
    }
    this.page.set(0);
  }

  toggleRow(row: T): void {
    const id = this.rowKey(row);
    const next = new Set(this.selected());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.setSelected(next);
  }

  toggleAllOnPage(): void {
    const ids = this.pageRows().map(this.keyExtractor());
    const all = this.allSelected();
    const next = new Set(this.selected());
    ids.forEach((id) => (all ? next.delete(id) : next.add(id)));
    this.setSelected(next);
  }

  toggleFilter(key: string, value: string): void {
    const current = this.selectionFor(key);
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    this.filterSelections.update((all) => ({ ...all, [key]: next }));
    this.page.set(0);
  }

  clearAllFilters(): void {
    const cleared: Record<string, string[]> = {};
    this.filters().forEach((f) => (cleared[f.key] = []));
    this.filterSelections.set(cleared);
    this.page.set(0);
  }

  toggleColumn(key: string): void {
    const next = new Set(this.hiddenCols());
    if (next.has(key)) next.delete(key);
    else next.add(key);
    this.hiddenCols.set(next);
  }

  goTo(page: number): void {
    this.page.set(Math.max(0, Math.min(this.pageCount() - 1, page)));
  }
  clearSelection(): void {
    // 1. Reset the internal set/signal that drives the checkboxes.
    this.selected.set(new Set()); // ← adjust to your internal field

    // 2. Emit so the parent's `(selectionChange)` stays in sync.
    this.selectionChange.emit([]);
  }

  private setSelected(next: Set<RowKey>): void {
    this.selected.set(next);
    this.selectionChange.emit([...next]);
  }

  private field(row: T, key: string): unknown {
    return (row as unknown as Record<string, unknown>)[key];
  }
}
