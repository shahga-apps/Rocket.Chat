import type { MutableRefObject } from 'react';
import { useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';

import { RoomHistoryManager } from '../../../../../app/ui-utils/client';
import { withThrottling } from '../../../../../lib/utils/highOrderFunctions';

export const useGetMore = (rid: string, atBottomRef: MutableRefObject<boolean>) => {
	const ref = useRef<HTMLElement>(null);

	const jumpToRef = useRef<HTMLElement>(undefined);

	useEffect(() => {
		if (!ref.current) {
			return;
		}

		const refValue = ref.current;

		const handleScroll = withThrottling({ wait: 300 })(async (event) => {
			const lastScrollTopRef = event.target.scrollTop;
			const height = event.target.clientHeight;
			const isLoading = RoomHistoryManager.isLoading(rid);
			const hasMore = RoomHistoryManager.hasMore(rid);
			const hasMoreNext = RoomHistoryManager.hasMoreNext(rid);

			if (!((isLoading === false && hasMore === true) || hasMoreNext === true)) {
				return;
			}

			if (jumpToRef.current) {
				return;
			}

			if (hasMore === true && lastScrollTopRef <= height / 3) {
				await RoomHistoryManager.getMore(rid);

				if (jumpToRef.current) {
					return;
				}
				flushSync(() => {
					RoomHistoryManager.restoreScroll(rid);
				});
			} else if (hasMoreNext === true && Math.ceil(lastScrollTopRef) >= event.target.scrollHeight - height) {
				RoomHistoryManager.getMoreNext(rid, atBottomRef);
				atBottomRef.current = false;
			}
		});

		refValue.addEventListener('scroll', handleScroll, {
			passive: true,
		});

		return () => {
			handleScroll.cancel();
			refValue.removeEventListener('scroll', handleScroll);
		};
	}, [rid, atBottomRef]);

	return {
		innerRef: ref,
		jumpToRef,
	};
};
