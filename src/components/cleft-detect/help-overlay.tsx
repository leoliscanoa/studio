"use client";

import { useState, useTransition } from "react";
import { HelpCircle, Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { getPhotoTakingGuidanceAction } from "@/app/actions";
import { Separator } from "../ui/separator";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

export function HelpOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [guidance, setGuidance] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setGuidance("");
    if (!userInput.trim()) return;

    startTransition(async () => {
      const result = await getPhotoTakingGuidanceAction({
        userQuery: userInput,
      });
      if (result.success) {
        setGuidance(result.guidance!);
      } else {
        setError(result.error!);
      }
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="secondary"
          size="icon"
          className="absolute bottom-5 right-5 rounded-full w-14 h-14 shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground"
          aria-label="Open help"
        >
          <HelpCircle className="w-7 h-7" />
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Photo Guidance</SheetTitle>
          <SheetDescription>
            Follow these tips to improve prediction accuracy.
          </SheetDescription>
        </SheetHeader>
        <div className="py-4 space-y-4 text-sm flex-1 overflow-y-auto">
            <ul className="list-disc space-y-2 pl-5">
                <li>Ensure the face is well-lit, avoiding shadows.</li>
                <li>Capture a clear, front-facing view of the person.</li>
                <li>The mouth area should be in focus and not blurry.</li>
                <li>Avoid any objects obstructing the face, like hands or pacifiers.</li>
                <li>Use a neutral background if possible.</li>
            </ul>
        </div>
        <Separator className="my-4"/>
        <div className="flex-1 flex flex-col">
          <h3 className="text-lg font-semibold mb-2">Need more help?</h3>
          <p className="text-sm text-muted-foreground mb-4">Ask our AI assistant for specific advice on taking the best photo.</p>
          <form onSubmit={handleSubmit} className="space-y-4 flex-1 flex flex-col">
            <Textarea
              placeholder="e.g., 'How to take a photo of a moving baby?'"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={isPending || !userInput.trim()}>
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Get Advice
            </Button>
          </form>
        </div>
        <SheetFooter className="mt-4">
            <div className="w-full space-y-4">
                {error && (
                    <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                {guidance && (
                    <Alert>
                    <AlertTitle>AI Guidance</AlertTitle>
                    <AlertDescription>{guidance}</AlertDescription>
                    </Alert>
                )}
            </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
