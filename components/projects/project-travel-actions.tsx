"use client";

import {
  Clipboard,
  ExternalLink,
  FileText,
  MapPinned,
  Phone,
  TicketCheck,
} from "lucide-react";
import Link from "next/link";
import type { MouseEvent } from "react";
import { useState } from "react";

import { createProjectFileAccessAction } from "@/app/(app)/projects/file-actions";
import type { ProjectFileRow, ProjectReservationRow } from "@/types/database";

type ProjectTravelActionsProps = {
  readonly files?: readonly ProjectFileRow[];
  readonly label: string;
  readonly location?: string | null;
  readonly projectId: string;
  readonly reservation?: ProjectReservationRow;
  readonly showReservationLink?: boolean;
};

export function mapsUrl(location: string): string {
  return `https://maps.google.com/?q=${encodeURIComponent(location)}`;
}

export function preferredMapsUrl(location: string, userAgent: string): string {
  const encoded = encodeURIComponent(location);
  if (/android/iu.test(userAgent)) return `geo:0,0?q=${encoded}`;
  if (/(iphone|ipad|ipod)/iu.test(userAgent)) return `maps://?q=${encoded}`;
  return mapsUrl(location);
}

export function ProjectTravelActions({
  files = [],
  label,
  location,
  projectId,
  reservation,
  showReservationLink = false,
}: ProjectTravelActionsProps) {
  const [message, setMessage] = useState("");
  const actionLocation = location || reservation?.location;

  function openDirections(event: MouseEvent<HTMLAnchorElement>): void {
    if (!actionLocation) return;
    const target = preferredMapsUrl(actionLocation, navigator.userAgent);
    if (target === mapsUrl(actionLocation)) return;
    event.preventDefault();
    window.location.href = target;
  }

  async function copyConfirmation(): Promise<void> {
    if (!reservation?.confirmation_number) return;
    try {
      await navigator.clipboard.writeText(reservation.confirmation_number);
      setMessage("예약번호를 복사했습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? "예약번호를 복사하지 못했습니다." : "복사를 다시 시도해 주세요.");
    }
  }

  async function openFile(file: ProjectFileRow): Promise<void> {
    setMessage("");
    const previewWindow = window.open("about:blank", "_blank");
    if (previewWindow) previewWindow.opener = null;
    try {
      const result = await createProjectFileAccessAction({
        fileId: file.id,
        mode: "preview",
        projectId,
      });
      if (result.status === "error" || !result.signedUrl) {
        previewWindow?.close();
        setMessage(result.message);
        return;
      }
      if (previewWindow) {
        previewWindow.location.href = result.signedUrl;
        return;
      }
      window.location.assign(result.signedUrl);
    } catch (error) {
      previewWindow?.close();
      setMessage(error instanceof Error ? "파일을 열지 못했습니다." : "네트워크 연결을 확인해 주세요.");
    }
  }

  return (
    <div className="project-travel-actions">
      <div className="project-travel-actions__commands">
        {actionLocation && (
          <a
            aria-label={`${label} 길찾기`}
            href={mapsUrl(actionLocation)}
            onClick={openDirections}
            rel="noreferrer"
            target="_blank"
          >
            <MapPinned aria-hidden="true" size={15} />
            길찾기
          </a>
        )}
        {reservation?.phone && (
          <a aria-label={`${label} 전화`} href={`tel:${reservation.phone}`}>
            <Phone aria-hidden="true" size={15} />
            전화
          </a>
        )}
        {reservation?.confirmation_number && (
          <button
            aria-label={`${label} 예약번호 복사`}
            onClick={() => void copyConfirmation()}
            type="button"
          >
            <Clipboard aria-hidden="true" size={15} />
            예약번호
          </button>
        )}
        {reservation?.website && (
          <a
            aria-label={`${label} 웹사이트 열기`}
            href={reservation.website}
            rel="noreferrer"
            target="_blank"
          >
            <ExternalLink aria-hidden="true" size={15} />
            웹사이트
          </a>
        )}
        {showReservationLink && reservation && (
          <Link
            aria-label={`${label} 예약 보기`}
            href={`/projects/${projectId}#reservations`}
          >
            <TicketCheck aria-hidden="true" size={15} />
            예약 보기
          </Link>
        )}
      </div>
      {files.length > 0 && (
        <div aria-label={`${label} 연결 파일`} className="project-travel-actions__files">
          {files.map((file) => (
            <button
              aria-label={`${file.original_filename} 열기`}
              key={file.id}
              onClick={() => void openFile(file)}
              type="button"
            >
              <FileText aria-hidden="true" size={15} />
              <span>{file.original_filename}</span>
            </button>
          ))}
        </div>
      )}
      {message && <p aria-live="polite" className="project-travel-actions__message">{message}</p>}
    </div>
  );
}
