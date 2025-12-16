import useSWR, { mutate } from "swr";

export interface Form {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    submissions: number;
  };
}

interface FormsResponse {
  forms: Form[];
}

// SWR fetcher function
const fetcher = async (url: string): Promise<FormsResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch forms");
  }
  return response.json();
};

// Global cache key
export const FORMS_CACHE_KEY = "/api/forms/my-forms";

/**
 * Custom hook for fetching forms with SWR
 * Provides automatic caching, deduplication, and revalidation
 */
export function useForms() {
  const { data, error, isLoading, isValidating } = useSWR<FormsResponse>(
    FORMS_CACHE_KEY,
    fetcher,
    {
      // Revalidate on focus after 30 seconds
      revalidateOnFocus: true,
      focusThrottleInterval: 30000,
      // Keep data fresh but don't spam requests
      dedupingInterval: 5000,
      // Don't revalidate on reconnect immediately
      revalidateOnReconnect: true,
      // Keep previous data while loading new
      keepPreviousData: true,
    }
  );

  const forms = data?.forms ?? [];

  return {
    forms,
    isLoading,
    isValidating,
    error,
  };
}

/**
 * Optimistically update the forms cache
 */
export function updateFormsCache(updater: (forms: Form[]) => Form[]) {
  mutate(
    FORMS_CACHE_KEY,
    (current: FormsResponse | undefined) => {
      if (!current) return current;
      return { forms: updater(current.forms) };
    },
    { revalidate: false }
  );
}

/**
 * Optimistically add a form to the cache
 */
export function addFormToCache(form: Form) {
  updateFormsCache((forms) => [form, ...forms]);
}

/**
 * Optimistically update a form in the cache
 */
export function updateFormInCache(formId: string, updates: Partial<Form>) {
  updateFormsCache((forms) =>
    forms.map((f) => (f.id === formId ? { ...f, ...updates } : f))
  );
}

/**
 * Optimistically remove a form from the cache
 */
export function removeFormFromCache(formId: string) {
  updateFormsCache((forms) => forms.filter((f) => f.id !== formId));
}

/**
 * Revalidate the forms cache (fetch fresh data from server)
 */
export function revalidateForms() {
  mutate(FORMS_CACHE_KEY);
}

/**
 * Set the forms cache directly
 */
export function setFormsCache(forms: Form[]) {
  mutate(FORMS_CACHE_KEY, { forms }, { revalidate: false });
}
