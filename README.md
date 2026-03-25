# Tangible Values - Exploring Generosity, Altruism, Cooperation, and Trust in the Digital Realm

**Keywords:** Values, Experimental Games, Digital/3D, Psychology, Reflection

## Development

- **Node:** 18.x (`engines` in `package.json`)
- **Install:** `npm install`
- **Dev server:** `npm run dev` (port 3333). Static assets live in `public/` (`models/`, `matcaps/`, `envmap/`) and are served under the same base path as production so dev and deploy behave the same.
- **Production build:** `npm run build` writes to `docs/` (configured for GitHub Pages).
- **Quality:** `npm run lint`, `npm test`, `npm run format:check` (also run in CI).

**Base URL:** Vite sets `import.meta.env.BASE_URL` from the `base` option in `vite.config.js`. The app resolves public files with `assetUrl()` in `src/lib/assetUrl.js`. To build for a different path (e.g. site root), set `VITE_BASE_PATH` when building, for example `VITE_BASE_PATH=/ npm run build`.

This project is an interactive website with 3D elements that showcase 4 thought experiments and allow for people to act upon the decision presented in each thought experiment prompt.

Traveling past the introductory foyer, you will come across an onboarding experience demonstrated through the Dictator Game. Upon completion, I invite you to freely navigate to areas presenting the Volunteer Dilemma, Exchange Game, and Trust Game. In each area, a floating diamond will be your point of contact, revealing the area’s respective thought experiment prompt and relaying instructions on completing the corresponding interactive component.

The goal of this project is to make the experience of thought experiments more engaging by improving the tangibility of values upheld whilst thinking through the various scenarios. The implementations I have made are centered around adding interactivity to conventionally written text, using technology to showcase this experience visually in a digital realm and representing decisions made with actions taken. In making values more tangible, I hope to inspire reflection on what people care about and possible reasons behind their actions.

**Model Credits**

- "[Coin](https://skfb.ly/6Cvs9)" by Jakob Henerey is licensed under Creative Commons Attribution
- "[Some eraser two](https://skfb.ly/ov7WJ)" by Artieee is licensed under Creative Commons Attribution
- "[Cara Cara Orange](https://skfb.ly/6RA9C)" by inciprocal is licensed under CC Attribution-NonCommercial-NoDerivs
- "[Apple](https://skfb.ly/ouB6N)" by Eydeet is licensed under Creative Commons Attribution
- "[Ancient arch](https://skfb.ly/os7TN)" by Marsy is licensed under Creative Commons Attribution
- "[Stone Arch](https://skfb.ly/ouTp8)" by Hvenix is licensed under Creative Commons Attribution
- "[Classical palace Doorway](https://skfb.ly/oPHQr)" by Samuel Francis Johnson (Oneironauticus) is licensed under Creative Commons Attribution
- "[stone arch](https://skfb.ly/oyYHr)" by Zakhar Tsaregorodtsev is licensed under Creative Commons Attribution

**Texture Credits**

- "[Farm Field (Pure Sky)](https://polyhaven.com/a/farm_field_puresky)" by Dimitrios Savva and Jarod Guest
- "[7A7A7A_D9D9D9_BCBCBC_B4B4B4](https://github.com/nidorx/matcaps/blob/master/PAGE-17.md)" by Nidorx
- "[Titanium](https://pixologic.com/zbrush/downloadcenter/library/#prettyPhoto) / [C7C7D7_4C4E5A_818393_6C6C74](https://github.com/nidorx/matcaps/blob/master/PAGE-28.md)" by Arran Lewis
- "[Black Cow](https://pixologic.com/zbrush/downloadcenter/library/#prettyPhoto['6']/23/) / [3B3C3F_DAD9D5_929290_ABACA8](https://github.com/nidorx/matcaps/blob/master/PAGE-5.md)" by Brian Schlosser

**Disclaimer.**
This project is still going through some performance optimizing adjustments.
<br>
For current usage:
<br>
If you get past the loading screen but end up on a gray blank screen, refresh your page. Repeat if needed. It's likely that the sphere was created before the ground and feel through the ground.
If you find that there's excessive jittering and it reads above 120 fps on the top left corner of the screen, try a different browser like Safari. I found that the fps gets lowerd to 60.
