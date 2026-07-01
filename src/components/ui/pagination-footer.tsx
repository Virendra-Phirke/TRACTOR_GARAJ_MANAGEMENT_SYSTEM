import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface PaginationFooterProps {
  pageIndex: number;
  pageSize: number;
  totalRows: number;
  setPageIndex: (index: number) => void;
  setPageSize: (size: number) => void;
}

const PAGE_SIZE_OPTIONS = [20, 50, 100, 200];

export function PaginationFooter({
  pageIndex,
  pageSize,
  totalRows,
  setPageIndex,
  setPageSize,
}: PaginationFooterProps) {
  const pageCount = Math.ceil(totalRows / pageSize);
  const startRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const endRow = Math.min((pageIndex + 1) * pageSize, totalRows);

  const getCanPreviousPage = () => pageIndex > 0;
  const getCanNextPage = () => pageIndex < pageCount - 1;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 py-3 border-t border-border/40">
      {/* Left: Row info + page size */}
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span>
          {startRow}–{endRow} of {totalRows}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs">Rows</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(v) => {
              setPageSize(Number(v));
              setPageIndex(0);
            }}
          >
            <SelectTrigger className="h-7 w-[68px] text-xs bg-transparent border-border/40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Right: Page navigation */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7 cursor-pointer"
          onClick={() => setPageIndex(0)}
          disabled={!getCanPreviousPage()}
        >
          <ChevronsLeft className="h-3.5 w-3.5" />
          <span className="sr-only">First page</span>
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7 cursor-pointer"
          onClick={() => setPageIndex(pageIndex - 1)}
          disabled={!getCanPreviousPage()}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span className="sr-only">Previous</span>
        </Button>

        {/* Page number indicator */}
        <span className="px-3 text-xs font-medium text-muted-foreground tabular-nums">
          Page {pageCount === 0 ? 0 : pageIndex + 1} of {pageCount}
        </span>

        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7 cursor-pointer"
          onClick={() => setPageIndex(pageIndex + 1)}
          disabled={!getCanNextPage()}
        >
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="sr-only">Next</span>
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7 cursor-pointer"
          onClick={() => setPageIndex(pageCount - 1)}
          disabled={!getCanNextPage()}
        >
          <ChevronsRight className="h-3.5 w-3.5" />
          <span className="sr-only">Last page</span>
        </Button>
      </div>
    </div>
  );
}
