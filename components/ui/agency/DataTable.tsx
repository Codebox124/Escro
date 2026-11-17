"use client"

import * as React from "react";
import { DataGrid } from "@mui/x-data-grid";

interface DataTableProps {
    rows:any
    columns:any
    pageSize?:number
    apiRef:any
}



export default function DataTable({ rows, columns, pageSize = 10, apiRef }: DataTableProps) {
  return (
    <div className="surface-card w-full min-w-0 overflow-hidden">
      <div className="w-full overflow-x-auto">
        <DataGrid
        apiRef={apiRef}
        className="table"
        density="comfortable"
          rows={rows}
          columns={columns}
          pageSizeOptions={[5, 10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize } },
          }}
          disableRowSelectionOnClick
          sx={{
            minHeight: "520px",
            minWidth: "960px",
            border: "none",
            fontSize: "14px",
            fontWeight: "500",
            color: "#0C110E",
            fontFamily: "var(--data-table-mont)",
            "--DataGrid-containerBackground": "#F4F1EA",
            "--DataGrid-rowBorderColor": "rgb(0 0 0 / 0.05)",
            "& .MuiDataGrid-columnHeaders": {
              borderBottom: "1px solid rgb(0 0 0 / 0.06)",
            },
            "& .MuiDataGrid-columnHeader": {
              paddingX: "20px",
            },
            "& .MuiDataGrid-columnHeaderTitle": {
              fontFamily: "var(--font-space), ui-monospace, monospace",
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "rgb(0 0 0 / 0.45)",
            },
            "& .MuiDataGrid-columnSeparator": {
              display: "none",
            },
            "& .MuiDataGrid-cell": {
              paddingX: "20px",
              display: "flex",
              alignItems: "center",
              borderColor: "rgb(0 0 0 / 0.05)",
            },
            "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within, & .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within": {
              outline: "none",
            },
            "& .MuiDataGrid-row:hover": {
              backgroundColor: "rgb(244 241 234 / 0.6)",
            },
            "& .MuiDataGrid-footerContainer": {
              borderTop: "1px solid rgb(0 0 0 / 0.05)",
              fontFamily: "var(--font-space), ui-monospace, monospace",
            },
            "& .MuiTablePagination-root, & .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
              fontFamily: "var(--font-space), ui-monospace, monospace",
              fontSize: "12px",
              color: "rgb(0 0 0 / 0.55)",
            },
            "& .MuiIconButton-root": {
              borderRadius: "9999px",
            },
          }}
        />
      </div>
    </div>
  );
}
