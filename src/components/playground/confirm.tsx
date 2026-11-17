import { useStore } from '@nanostores/react';
import { atom } from 'nanostores';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface ConfirmRequest {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
}

const $confirm = atom<ConfirmRequest | null>(null);

export const askConfirm = (req: ConfirmRequest) => $confirm.set(req);

/** One shared confirmation dialog for destructive actions (reset, replacing code with a template). */
export function ConfirmDialog() {
  const req = useStore($confirm);
  return (
    <AlertDialog open={req !== null} onOpenChange={(open) => !open && $confirm.set(null)}>
      {req && (
        <AlertDialogContent>
          <AlertDialogTitle>{req.title}</AlertDialogTitle>
          <AlertDialogDescription>{req.description}</AlertDialogDescription>
          <div className="mt-5 flex justify-end gap-2">
            <AlertDialogCancel asChild>
              <Button variant="ghost">Cancel</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="primary"
                onClick={() => {
                  req.onConfirm();
                }}
              >
                {req.confirmLabel}
              </Button>
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      )}
    </AlertDialog>
  );
}
