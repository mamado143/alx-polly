"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { CheckCircle } from "lucide-react";

export function SuccessMessage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    if (searchParams.get("created") === "true") {
      toast({
        title: "Poll Created Successfully!",
        description: "Your poll has been created and is now available for voting.",
        variant: "success",
      });
    } else if (searchParams.get("updated") === "true") {
      toast({
        title: "Poll Updated Successfully!",
        description: "Your poll has been updated and changes are now live.",
        variant: "success",
      });
    } else if (searchParams.get("deleted") === "true") {
      toast({
        title: "Poll Deleted Successfully!",
        description: "Your poll has been permanently deleted.",
        variant: "success",
      });
    }
  }, [searchParams, toast]);

  return null;
}
