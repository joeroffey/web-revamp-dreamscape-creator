-- Add DELETE policy for gift_cards for admins
CREATE POLICY "Admins can delete gift cards"
ON public.gift_cards
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));