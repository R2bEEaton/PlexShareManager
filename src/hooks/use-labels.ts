import { useQuery } from "@tanstack/react-query";

interface Label {
  id: string;
  key: string;
  tag: string;
  count: number;
}

interface UseLabelsOptions {
  sectionId?: string;
  enabled?: boolean;
}

export function useLabels({ sectionId, enabled = true }: UseLabelsOptions) {
  return useQuery<Label[]>({
    queryKey: ["labels", sectionId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (sectionId) params.append("sectionId", sectionId);

      const response = await fetch(`/api/plex/labels?${params}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch labels");
      }

      return data.labels;
    },
    enabled: enabled && !!sectionId,
  });
}
