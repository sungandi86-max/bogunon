"use client";

import { MapPin, Search, School } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";

import {
  clearUserSchoolSettingsAction,
  saveUserSchoolSettingsAction,
} from "@/app/(app)/settings/school-actions";
import { searchNeisSchoolsAction } from "@/app/(app)/neis-academic-calendar-actions";
import type { NeisSchool, UserSchoolSettings } from "@/lib/neis/types";

type SelectedSchool = NeisSchool | UserSchoolSettings;
type PendingAction = "search" | "save" | "clear";

function selectedSchoolDetails(school: SelectedSchool) {
  return {
    officeCode: school.officeCode,
    schoolCode: school.schoolCode,
    name: school.name,
    officeName: school.officeName,
    schoolLevel: "type" in school ? school.type : school.schoolLevel,
    region: school.region,
    address: school.address,
  };
}

export function SchoolInformationCard({ initialSchool }: { readonly initialSchool: UserSchoolSettings | null }) {
  const [query, setQuery] = useState("");
  const [schools, setSchools] = useState<readonly NeisSchool[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<SelectedSchool | null>(initialSchool);
  const [mealEnabled, setMealEnabled] = useState(initialSchool?.mealEnabled ?? true);
  const [weatherEnabled, setWeatherEnabled] = useState(initialSchool?.weatherEnabled ?? true);
  const [searched, setSearched] = useState(false);
  const [pending, setPending] = useState<PendingAction>();
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  async function searchSchools(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (query.trim().length < 2) {
      setMessageType("error");
      setMessage("학교명을 두 글자 이상 입력해 주세요.");
      return;
    }
    setPending("search");
    setMessage("");
    try {
      const result = await searchNeisSchoolsAction({ query });
      if (result.status === "error") {
        setSchools([]);
        setSearched(false);
        setMessageType("error");
        setMessage(result.message);
        return;
      }
      setSchools(result.schools);
      setSearched(true);
    } finally {
      setPending(undefined);
    }
  }

  function selectSchool(school: NeisSchool): void {
    setSelectedSchool(school);
    setSchools([]);
    setSearched(false);
    setMessage("");
  }

  async function saveSchool(): Promise<void> {
    if (!selectedSchool) return;
    const details = selectedSchoolDetails(selectedSchool);
    setPending("save");
    setMessage("");
    try {
      const result = await saveUserSchoolSettingsAction({
        ...details,
        latitude: "latitude" in selectedSchool ? selectedSchool.latitude : null,
        longitude: "longitude" in selectedSchool ? selectedSchool.longitude : null,
        mealEnabled,
        weatherEnabled,
      });
      setMessageType(result.status);
      setMessage(result.message);
      if (result.status === "success") {
        setSelectedSchool({
          ...details,
          latitude: "latitude" in selectedSchool ? selectedSchool.latitude : null,
          longitude: "longitude" in selectedSchool ? selectedSchool.longitude : null,
          mealEnabled,
          weatherEnabled,
        });
      }
    } finally {
      setPending(undefined);
    }
  }

  async function clearSchool(): Promise<void> {
    if (!window.confirm("저장된 학교 정보를 초기화할까요?")) return;
    setPending("clear");
    setMessage("");
    try {
      const result = await clearUserSchoolSettingsAction();
      setMessageType(result.status);
      setMessage(result.message);
      if (result.status === "success") {
        setSelectedSchool(null);
        setSchools([]);
        setQuery("");
        setMealEnabled(true);
        setWeatherEnabled(true);
      }
    } finally {
      setPending(undefined);
    }
  }

  const details = selectedSchool ? selectedSchoolDetails(selectedSchool) : null;
  const busy = pending !== undefined;

  return (
    <section className="settings-card school-information-card" id="school-information">
      <div className="settings-card__heading">
        <School aria-hidden="true" size={20} />
        <div>
          <h2>학교 정보</h2>
          <p>학교를 설정하면 급식, 날씨 및 학교 일정 기능을 개인화할 수 있습니다.</p>
        </div>
      </div>

      {!selectedSchool && (
        <form className="school-settings-search" onSubmit={searchSchools}>
          <label>
            <span>학교 검색</span>
            <span className="school-settings-search__control">
              <input
                autoComplete="off"
                disabled={busy}
                maxLength={80}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="예: 여의도고등학교"
                value={query}
              />
              <button className="button button--primary" disabled={busy || query.trim().length < 2} type="submit">
                <Search aria-hidden="true" size={17} />
                {pending === "search" ? "검색 중…" : "학교 검색"}
              </button>
            </span>
          </label>
        </form>
      )}

      {searched && schools.length === 0 && <p className="school-settings-empty" role="status">검색 결과가 없습니다.</p>}
      {schools.length > 0 && (
        <div aria-label="학교 검색 결과" className="school-settings-results" role="list">
          {schools.map((school) => (
            <div key={`${school.officeCode}-${school.schoolCode}`} role="listitem">
              <button
                aria-label={`${school.name} 선택`}
                disabled={busy}
                onClick={() => selectSchool(school)}
                type="button"
              >
                <School aria-hidden="true" size={18} />
                <span>
                  <strong>{school.name}</strong>
                  <small>{school.type} · {school.region}</small>
                  <small><MapPin aria-hidden="true" size={13} />{school.address}</small>
                </span>
              </button>
            </div>
          ))}
        </div>
      )}

      {details && (
        <>
          <dl className="school-settings-details">
            <div><dt>학교명</dt><dd>{details.name}</dd></div>
            <div><dt>학교 코드</dt><dd>{details.schoolCode}</dd></div>
            <div><dt>학교급</dt><dd>{details.schoolLevel ?? "정보 없음"}</dd></div>
            <div><dt>지역</dt><dd>{details.region ?? details.officeName}</dd></div>
            <div><dt>주소</dt><dd>{details.address ?? "정보 없음"}</dd></div>
          </dl>
          <div className="school-settings-toggles">
            <label className="settings-toggle-row">
              <span><strong>오늘의 급식 사용</strong><small>오늘 화면에서 선택한 학교의 급식을 조회합니다.</small></span>
              <input aria-label="오늘의 급식 사용" checked={mealEnabled} disabled={busy} onChange={(event) => setMealEnabled(event.target.checked)} type="checkbox" />
              <span aria-hidden="true" className="settings-switch"><span /></span>
            </label>
            <label className="settings-toggle-row">
              <span><strong>오늘의 날씨 사용</strong><small>학교 지역의 날씨 연동을 사용할 수 있도록 설정합니다.</small></span>
              <input aria-label="오늘의 날씨 사용" checked={weatherEnabled} disabled={busy} onChange={(event) => setWeatherEnabled(event.target.checked)} type="checkbox" />
              <span aria-hidden="true" className="settings-switch"><span /></span>
            </label>
          </div>
          <div className="school-settings-actions">
            <button className="button button--primary" disabled={busy} onClick={() => void saveSchool()} type="button">
              {pending === "save" ? "저장 중…" : "학교 정보 저장"}
            </button>
            <button className="button button--secondary" disabled={busy} onClick={() => { setSelectedSchool(null); setMessage(""); }} type="button">학교 변경</button>
            <button className="button button--danger" disabled={busy} onClick={() => void clearSchool()} type="button">
              {pending === "clear" ? "초기화 중…" : "학교 정보 초기화"}
            </button>
          </div>
        </>
      )}

      {message && <p aria-live="polite" className={messageType === "error" ? "form-message form-message--error" : "form-message"} {...(messageType === "error" ? { role: "alert" } : {})}>{message}</p>}
      <p className="school-settings-privacy">학교 정보는 급식, 날씨 및 일정 개인화를 위해 사용자 계정에 저장됩니다. 학생 정보는 저장하지 않습니다.</p>
    </section>
  );
}
