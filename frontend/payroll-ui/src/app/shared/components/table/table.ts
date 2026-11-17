// src/app/shared/components/table/table.ts
import { Directive } from '@angular/core';

/**
 * Table building blocks (Angular version of the Table / TableHeader / TableBody / ... primitives).
 * Each one is an attribute directive that adds the base styles to a native table element:
 *
 *   <table appTable>
 *     <thead appTableHeader><tr appTableRow><th appTableHead>Name</th></tr></thead>
 *     <tbody appTableBody><tr appTableRow><td appTableCell>Priya</td></tr></tbody>
 *   </table>
 *
 * Extra classes you add on the element are kept: <td appTableCell class="text-right">
 */

@Directive({
  selector: 'table[appTable]',
  standalone: true,
  host: { class: 'w-full caption-bottom text-sm' },
})
export class AppTable {}

@Directive({
  selector: 'thead[appTableHeader]',
  standalone: true,
  host: { class: '[&_tr]:border-b' },
})
export class AppTableHeader {}

@Directive({
  selector: 'tbody[appTableBody]',
  standalone: true,
  host: { class: '[&_tr:last-child]:border-0' },
})
export class AppTableBody {}

@Directive({
  selector: 'tfoot[appTableFooter]',
  standalone: true,
  host: { class: 'border-t bg-gray-50 font-medium [&>tr]:last:border-b-0' },
})
export class AppTableFooter {}

@Directive({
  selector: 'tr[appTableRow]',
  standalone: true,
  host: { class: 'border-b transition-colors hover:bg-gray-50' },
})
export class AppTableRow {}

@Directive({
  selector: 'th[appTableHead]',
  standalone: true,
  host: {
    class: 'h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-gray-900',
  },
})
export class AppTableHead {}

@Directive({
  selector: 'td[appTableCell]',
  standalone: true,
  host: { class: 'p-2 align-middle whitespace-nowrap' },
})
export class AppTableCell {}

@Directive({
  selector: 'caption[appTableCaption]',
  standalone: true,
  host: { class: 'mt-4 text-sm text-gray-500' },
})
export class AppTableCaption {}

/** Import this one array to get every table directive. */
export const TABLE_IMPORTS = [
  AppTable,
  AppTableHeader,
  AppTableBody,
  AppTableFooter,
  AppTableRow,
  AppTableHead,
  AppTableCell,
  AppTableCaption,
] as const;
