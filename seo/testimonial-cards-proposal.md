# Testimonial cards — Patricia Chin & Christine Chew

Drafted 2026-09-10, **shipped 2026-09-14** — Jeff supplied real event
photos for both (`patricia.png` and `Teacher's day`, both from his
Downloads folder), so option (a) was used instead of the photo-less
note-only variant originally drafted here.

## Resolution log

1. **Attribution** — resolved 2026-09-14 by live-checking the GBP Reviews
   dashboard directly: the wedding review is from **Patricia Chin**, the
   Teacher's Day/superhero review is from **Christine Chew**. (Was backwards
   in the original 2026-09-10 draft and in `gbp-posts-queue.md`'s reply
   labels — reply *content* was always posted to the correct review, only
   the name labels in these tracking files were swapped.)
2. **Photos** — resolved 2026-09-14. Jeff provided both source strips
   (already the actual AI photo booth output, not raw event photos).
   Resized to 800px width, saved as both `.png` (source) and `.webp`
   (compressed, quality 68) in `photos/testimonials/`:
   `patricia.webp` (146KB) and `christine.webp` (195KB) — in line with the
   size of the other strip images in that folder (60dad.webp 117KB,
   bday.webp 95KB).
3. **Google review badge** — not added. Went with a lighter-weight
   `<em>Wedding · Google review</em>` / `<em>Teacher's Day · Google
   review</em>` line in the existing `note-sig` element instead of a new
   `.google-badge` CSS class + markup pattern — avoids introducing a new
   visual pattern for two cards when the existing `note-sig` slot already
   had room for it.

## What shipped

Two new `.strip-card.single-photo` entries added to `#testiBoard` in
`index.html`, matching the existing 5 cards' markup pattern exactly
(same `strip-frames`/`tape`/`sticky-note`/`pushpin` structure, `single-photo`
CSS already hides the placeholder frame/tape/pushpin elements and shows
just the real photo + sticky note):

- `data-strip="patricia"` — pink sticky note, pull-quote: "Our guests
  wouldn't stop talking about it — the customisation and effects made it
  feel made for our wedding, not just rented for it." — Patricia Chin.
- `data-strip="superhero"` — yellow sticky note, pull-quote: "Teachers and
  staff turned into their own superheroes — real AI graphics and video,
  not just a filter. Will definitely use them again." — Christine Chew.

Verified visually in the browser preview (local `http.server`, both mobile
and wider viewports) — cards render correctly, images load, no console
errors, horizontal drag/scroll on the corkboard still works.

## Full original review text (for reference)

**Patricia Chin — wedding:**
> We had such a great experience with Jeff and the photobooth at our
> wedding! Our family and friends had so much fun, and we received so many
> comments from our guests about how engaging and enjoyable the photobooth
> experience was. The photos turned out beautifully too! I especially loved
> the customisation and the selection of effects available. They were such
> thoughtful touches and made the experience feel even more personalised
> and special for our celebration. Thank you, Jeff, for adding so much fun
> to our wedding! We would definitely engage his services again for future
> events and would highly recommend him to our friends and family.

**Christine Chew — Teacher's Day / superhero theme:**
> Great experience with Playing with Photo Photo Booth for an event. Jeff
> was very professional and easy to work with, providing many nice
> customised options for our photo booth printouts. What's unique and
> different about the booth was the option to have the photo get turned
> into special AI graphics and videos! We had a superhero theme and the
> teachers and staff had a lot of fun doing that. Will definitely use them
> again for other events!

## Next candidate: Jaslynn Lai (birthday party)

Full review text now captured (2026-09-14):
> We tried this for my daughter's 7th birthday and the kids really enjoyed
> it. The AI animals were such a cute touch haha, they got so excited
> seeing the animals appear and walk around them. A few of them kept coming
> back to try again 😂 Really nice idea Happy to support a small local
> business doing something creative like this ❤️

A third card for the birthday-party angle would round out the corkboard
(currently wedding/corporate/gala-heavy). **Needs a photo strip from that
event** — same as the first two, Jeff would need to supply the actual booth
output image before this can be drafted the same way. Not shipped yet.
