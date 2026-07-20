"use client";

import { FileSpreadsheet, School } from "lucide-react";
import { useState } from "react";

import { AcademicCalendarImport } from "@/components/calendar/academic-calendar-import";
import { NeisAcademicCalendarImport } from "@/components/calendar/neis-academic-calendar-import";

type ImportMethod = "neis" | "file";

export function AcademicCalendarImportMethods({ onClose, onComplete }: { readonly onClose?: () => void; readonly onComplete?: () => void }) {
  const [method, setMethod] = useState<ImportMethod>("neis");
  return <div className="academic-import-methods">
    <div aria-label="학사일정 가져오기 방식" className="academic-import-methods__tabs" role="group">
      <button aria-pressed={method === "neis"} onClick={() => setMethod("neis")} type="button"><School aria-hidden="true" size={17} />NEIS 자동 불러오기</button>
      <button aria-pressed={method === "file"} onClick={() => setMethod("file")} type="button"><FileSpreadsheet aria-hidden="true" size={17} />Excel/CSV 파일 가져오기</button>
    </div>
    <div>
      {method === "neis" ? <NeisAcademicCalendarImport {...(onClose ? { onClose } : {})} {...(onComplete ? { onComplete } : {})} /> : <AcademicCalendarImport {...(onClose ? { onClose } : {})} {...(onComplete ? { onComplete } : {})} />}
    </div>
  </div>;
}
