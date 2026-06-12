'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useBoards } from '@/hooks/useBoards';
import { useMyPosts } from '@/hooks/useMyPosts';
import { findBoardByType } from '@/domain/board/types';
import {
  computeRecordStreak,
  computeWeekRecordRate,
  countRecordsInWeek,
  getRecordDateKeys,
} from '@/domain/routine/stats';

const DASHBOARD_FETCH_SIZE = 100;

export function useRoutineDashboard() {
  const [weekOffset, setWeekOffset] = useState(0);
  const { isLoggedIn } = useAuth();
  const { boards, isLoading: boardsLoading, error: boardsError } = useBoards();
  const symptomBoard = findBoardByType(boards, 'SYMPTOM');
  const reviewBoard = findBoardByType(boards, 'PRODUCT_REVIEW');

  const { postPage, isLoading: postsLoading, error: postsError } = useMyPosts(
    isLoggedIn,
    DASHBOARD_FETCH_SIZE,
    symptomBoard?.id,
  );

  const symptomRecords = postPage.content;
  const recordDateKeys = useMemo(() => getRecordDateKeys(symptomRecords), [symptomRecords]);

  const stats = useMemo(
    () => ({
      total: symptomRecords.length,
      thisWeek: countRecordsInWeek(symptomRecords, 0),
      streak: computeRecordStreak(symptomRecords),
      weekRate: computeWeekRecordRate(symptomRecords, weekOffset),
      weekRecords: countRecordsInWeek(symptomRecords, weekOffset),
    }),
    [symptomRecords, weekOffset],
  );

  return {
    isLoggedIn,
    weekOffset,
    setWeekOffset,
    boardsLoading,
    postsLoading,
    isLoading: boardsLoading || postsLoading,
    error: boardsError ?? postsError,
    symptomBoard,
    reviewBoard,
    symptomRecords,
    recordDateKeys,
    stats,
    recentRecords: symptomRecords.slice(0, 5),
  };
}
