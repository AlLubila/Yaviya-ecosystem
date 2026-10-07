const demoProductPhotos = {
  1: { title: "Casque sans fil Essential", img: "headphones.png" },
  2: { title: "Baskets Urban Orange", img: "sneakers.png" },
  3: { title: "Sac à main Daily", img: "handbag.png" },
  4: { title: "Casque Bluetooth Studio", img: "headphones.png" },
  5: { title: "Casque sans fil Essential", img: "headphones.png" },
  6: { title: "Casque Bluetooth Studio", img: "headphones.png" },
  7: { title: "Baskets Urban Orange", img: "sneakers.png" },
  8: { title: "Baskets City Walk", img: "sneakers.png" },
  9: { title: "Baskets City Walk", img: "sneakers.png" },
  10: { title: "Sac à main Daily", img: "handbag.png" },
  11: { title: "Sac à main Daily", img: "handbag.png" },
  12: { title: "Sac week-end", img: "handbag.png" },
  13: { title: "Service de table 12 pièces", img: "product-dinner-set.jpg" },
  14: { title: "Assiettes 6 pièces", img: "product-plates.jpg" },
  15: { title: "Ventilateur sur pied", img: "product-standing-fan.jpg" },
  16: { title: "Ventilateur compact", img: "product-desk-fan.jpg" },
  17: { title: "Savon doux 3 pièces", img: "product-soap.jpg" },
  18: { title: "Lait de beauté 400 ml", img: "product-lotion.jpg" },
  19: { title: "Coffret de jouets", img: "product-toys.jpg" },
  20: { title: "Jeu éducatif", img: "product-puzzle.jpg" },
  21: { title: "Riz 5 kg", img: "product-rice.jpg" },
  22: { title: "Café 250 g", img: "product-coffee.jpg" },
  23: { title: "Ring light 26 cm", img: "product-ringlight.jpg" },
  24: { title: "Photo personnalisée encadrée", img: "product-frame.jpg" },
  25: { title: "Guitare acoustique", img: "product-guitar.jpg" },
  26: { title: "Clavier musical", img: "product-keyboard.jpg" },
  27: { title: "Rallonge 5 prises", img: "product-power-strip.jpg" },
  28: { title: "Montre classique", img: "product-watch.jpg" },
  29: { title: "Cravate élégante", img: "product-tie.jpg" },
  30: { title: "Câble USB-C", img: "product-usb-c.jpg" },
  500: { title: "Chemise homme classique", img: "product-shirt.jpg" },
  501: { title: "Robe femme quotidienne", img: "product-dress.jpg" },
  502: { title: "Veste homme habillée", img: "product-blazer.jpg" },
  503: { title: "Chaussures femme élégantes", img: "product-womens-shoes.jpg" },
  504: { title: "Accessoire femme foulard", img: "product-scarf.jpg" },
  505: { title: "Habit enfant ensemble", img: "product-kids-outfit.jpg" },
  506: {
    title: "Téléphone smartphone Essential",
    img: "product-smartphone.jpg",
  },
  507: { title: "Ordinateur portable Bureau", img: "product-laptop.jpg" },
  508: { title: "Cosmétique soin quotidien", img: "product-cosmetic.jpg" },
};
function productPictures(product) {
  const images = Array.isArray(product.images) ? product.images : [];
  return [
    ...new Set(
      (images.length ? images : [product.img]).filter(
        (src) =>
          typeof src === "string" &&
          src.trim() &&
          src !== "product-undefined.jpg",
      ),
    ),
  ];
}
function hydrateProductPhotos() {
  for (const product of products) {
    const demo = demoProductPhotos[product.id];
    let images = productPictures(product);
    if (!images.length && demo && product.title === demo.title) {
      images = [demo.img];
      product.desc = T(
        "Produit et photo illustratifs pour explorer YAVIYA. Les caractéristiques et la disponibilité seront confirmées par le vendeur.",
        "Illustrative product and photo for exploring YAVIYA. The seller will confirm specifications and availability.",
      );
    }
    const demoGallery =
      window.YAVIYA_MARKET_CONFIG?.productGalleries?.[demo?.img];
    if (
      demo &&
      product.title === demo.title &&
      images.length === 1 &&
      images[0] === demo.img &&
      demoGallery
    )
      images = [...demoGallery];
    product.images = images;
    product.img = images[0] || null;
  }
}
const photosApplyDelivery = applyDelivery;
applyDelivery = function (data, redraw = true) {
  photosApplyDelivery(data, false);
  hydrateProductPhotos();
  if (redraw) redrawDeliveryViews();
  render();
  renderOffers();
};
hydrateProductPhotos();
const galleryCard = card;
card = function (product) {
  const html = galleryCard(product),
    photos = productPictures(product);
  return photos.length > 1
    ? html.replace(
        '</button><div class="product-info">',
        `<span class="product-photo-count">${photos.length} ${T("photos", "photos")}</span></button><div class="product-info">`,
      )
    : html;
};
function productGalleryMarkup(product) {
  const photos = productPictures(product);
  return photos.length
    ? `<section class="product-gallery" tabindex="0" aria-label="${T("Photos du produit", "Product photos")}"><div class="product-gallery-main"><img id="product-gallery-image" src="${esc(photos[0])}" alt="${esc(product.title)} · ${T("photo", "photo")} 1" decoding="async"></div>${photos.length > 1 ? `<div class="gallery-navigation"><button class="add" type="button" data-gallery-direction="-1">${T("Précédente", "Previous")}</button><span id="product-gallery-count" aria-live="polite">1 / ${photos.length}</span><button class="add" type="button" data-gallery-direction="1">${T("Suivante", "Next")}</button></div><div class="product-gallery-thumbs">${photos.map((src, index) => `<button type="button" data-gallery-index="${index}" aria-pressed="${index === 0}" aria-label="${T("Voir la photo", "View photo")} ${index + 1} ${T("de", "of")} ${esc(product.title)}"><img src="${esc(src)}" alt="" loading="lazy"></button>`).join("")}</div>` : ""}</section>`
    : `<div class="product-gallery-empty">${T("Le vendeur ajoutera les photos de ce produit.", "The seller will add photos for this product.")}</div>`;
}
function showProductDetails(id) {
  const product = products.find((p) => p.id === id);
  if (!product) return;
  const shop = shopOf(product);
  if (!shop) return;
  open(
    `<section class="product-detail-layout">${productGalleryMarkup(product)}<div class="product-detail-info"><span class="eyebrow">${esc(product.category)}</span><h2>${esc(product.title)}</h2><button class="product-seller" data-shop="${product.seller}"><span class="seller-label">${esc(shop.name)}</span> ${sellerVerificationBadge(shop)}</button><div class="price">${money(product.price)}</div><p>${esc(product.desc)}</p><p>${product.stock > 0 ? T("Disponible", "Available") : T("Indisponible", "Unavailable")}</p><div class="purchase-actions"><button class="primary" data-buy-now="${product.id}" ${!product.stock ? "disabled" : ""}>${T("Acheter maintenant", "Buy now")}</button><button class="add" data-add="${product.id}" ${!product.stock ? "disabled" : ""}>${T("Ajouter au panier", "Add to cart")}</button></div>${product.id < 10000 && !productPictures(product).some((src) => src.startsWith("/api/")) ? "" : `<p class="demo-note">${T("Catalogue du vendeur · parcours de démonstration.", "Seller catalogue · demonstration shopping flow.")}</p>`}</div></section><section class="detail-related">${related(product)}</section>`,
  );
  const photos = productPictures(product),
    gallery = $(".product-gallery");
  if (!gallery) return;
  let index = 0;
  function select(next) {
    index = (next + photos.length) % photos.length;
    $("#product-gallery-image").src = photos[index];
    $("#product-gallery-image").alt =
      product.title + " · " + T("photo", "photo") + " " + (index + 1);
    const count = $("#product-gallery-count");
    if (count) count.textContent = index + 1 + " / " + photos.length;
    gallery
      .querySelectorAll("[data-gallery-index]")
      .forEach((button) =>
        button.setAttribute(
          "aria-pressed",
          String(+button.dataset.galleryIndex === index),
        ),
      );
  }
  gallery.onclick = (event) => {
    const button = event.target.closest(
      "[data-gallery-index],[data-gallery-direction]",
    );
    if (!button) return;
    event.preventDefault();
    select(
      button.dataset.galleryIndex !== undefined
        ? +button.dataset.galleryIndex
        : index + Number(button.dataset.galleryDirection),
    );
  };
  gallery.onkeydown = (event) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      select(index + (event.key === "ArrowRight" ? 1 : -1));
    }
  };
}
window.addEventListener(
  "click",
  (event) => {
    const button = event.target.closest("[data-detail]");
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    showProductDetails(+button.dataset.detail);
  },
  true,
);

let photoEditorSession = 0;
async function uploadProductPhoto(file, productId, sellerId) {
  const data = new FormData();
  data.set("photo", file);
  data.set("productId", productId);
  data.set("sellerId", sellerId);
  const response = await fetch("/api/product-photos", {
    method: "POST",
    body: data,
  });
  const value = await response.json();
  if (!response.ok)
    throw Error(
      T(
        "La photo n’a pas pu être enregistrée. Vérifiez le format et la taille, puis réessayez.",
        "The photo could not be saved. Check its format and size, then retry.",
      ),
    );
  return value.url;
}
function uploadedPhotoId(src) {
  if (!src?.startsWith("/api/product-photos/image?")) return null;
  return new URL(src, location.origin).searchParams.get("photoId");
}
editProduct = function (id) {
  if (!deliveryReady || deliverySaving) {
    toast(
      T(
        "Attendez la synchronisation du catalogue.",
        "Wait for catalogue synchronization.",
      ),
    );
    return;
  }
  const product = id ? products.find((p) => p.id === id) : null,
    sellerId = product?.seller || selectedSeller;
  if (!ownedSellerIds().includes(sellerId)) {
    toast(
      T(
        "Vous ne pouvez gérer que vos boutiques.",
        "You can only manage your own shops.",
      ),
    );
    return;
  }
  const session = ++photoEditorSession,
    draftId = product?.id || Math.max(...products.map((p) => p.id)) + 1,
    originalPictures = product ? productPictures(product) : [],
    entries = originalPictures.map((src) => ({ src }));
  let busy = false;
  const previewUrls = new Set();
  open(
    `<h2>${T(product ? "Modifier le produit" : "Ajouter un produit", product ? "Edit product" : "Add a product")}</h2><form id="product-form" class="editor"><label>${T("Nom du produit *", "Product name *")}<input name="title" maxlength="100" required value="${esc(product?.title || "")}"></label><label>${T("Catégorie", "Category")}<select name="category">${[...new Set([...window.YAVIYA_MARKET_CONFIG.categorySections.map((s) => s[0]), ...products.map((p) => p.category)])].map((category) => `<option ${category === product?.category ? "selected" : ""}>${esc(category)}</option>`).join("")}</select></label><div class="product-editor-values"><label>${T("Prix", "Price")} (${window.YAVIYA_COUNTRY === "CG" ? "FCFA" : "FC"})<input name="price" type="number" min="1" max="1000000000" required value="${product?.price || ""}"></label><label>${T("Stock", "Stock")}<input name="stock" type="number" min="0" max="100000" step="1" required value="${product?.stock ?? 0}"></label></div><section class="product-photo-editor"><h3>${T("Photos du produit", "Product photos")}</h3><p>${T("Ajoutez jusqu’à 8 photos : vue principale, profil, arrière et détails. Photographiez le même article sous différents angles. La première photo est la couverture du catalogue.", "Add up to 8 photos: main view, side, back and details. Photograph the same item from different angles. The first photo is the catalogue cover.")}</p><label class="photo-upload-choice">${T("Ajouter plusieurs photos", "Add multiple photos")}<input id="product-photo-files" name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple></label><p class="photo-upload-limits">${T("JPG, PNG ou WebP · 8 Mo maximum par photo.", "JPG, PNG or WebP · maximum 8 MB per photo.")}</p><div id="product-photo-previews" class="product-photo-previews"></div></section><label class="product-visible-choice"><input name="visible" type="checkbox" ${!product || product.visible ? "checked" : ""}>${T("Afficher après validation du produit par l’admin", "Show after administrator approval")}</label><p id="product-photo-error" role="alert"></p><p id="product-photo-progress" role="status" aria-live="polite"></p><div class="product-editor-actions"><button class="primary" type="submit">${T("Enregistrer le produit", "Save product")}</button><button class="add" type="button" id="cancel-product-edit">${T("Annuler", "Cancel")}</button></div></form>`,
  );
  const form = $("#product-form"),
    input = $("#product-photo-files"),
    previews = $("#product-photo-previews"),
    error = $("#product-photo-error"),
    progress = $("#product-photo-progress");
  form.elements.category
    .closest("label")
    .insertAdjacentHTML(
      "afterend",
      `<label>${T("Sous-catégorie", "Subcategory")}<select name="subcategory"><option value="">${T("Non précisée", "Not specified")}</option></select></label>`,
    );
  function categoryChildren() {
    const children = window.YAVIYA_MARKET_CONFIG.categorySections
      .filter((s) => s[0] === form.elements.category.value)
      .flatMap((s) => s[3]);
    form.elements.subcategory.innerHTML =
      `<option value="">${T("Non précisée", "Not specified")}</option>` +
      [...new Map(children.map((c) => [c[0], c])).values()]
        .map(([fr, en]) => `<option value="${esc(fr)}">${T(fr, en)}</option>`)
        .join("");
    if (product?.category === form.elements.category.value)
      form.elements.subcategory.value = product.subcategory || "";
  }
  form.elements.category.onchange = categoryChildren;
  categoryChildren();
  function cleanPreviews() {
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    previewUrls.clear();
  }
  function showPreviews() {
    previews.innerHTML =
      entries
        .map(
          (entry, index) =>
            `<article class="product-photo-preview"><img src="${esc(entry.src)}" alt="${T("Aperçu photo", "Photo preview")} ${index + 1}"><p>${index === 0 ? T("Photo principale", "Main photo") : T("Photo", "Photo") + " " + (index + 1)}</p><div>${index > 0 ? `<button class="add" type="button" data-photo-action="main" data-photo-index="${index}">${T("Photo principale", "Make main")}</button>` : ""}<button class="add" type="button" data-photo-action="previous" data-photo-index="${index}" ${index === 0 ? "disabled" : ""}>${T("Avant", "Earlier")}</button><button class="add" type="button" data-photo-action="next" data-photo-index="${index}" ${index === entries.length - 1 ? "disabled" : ""}>${T("Après", "Later")}</button><button class="photo-remove" type="button" data-photo-action="remove" data-photo-index="${index}" aria-label="${T("Retirer la photo", "Remove photo")} ${index + 1}">${T("Retirer", "Remove")}</button></div></article>`,
        )
        .join("") ||
      `<p class="photos-empty">${T("Aucune photo ajoutée. Choisissez les images de votre produit.", "No photos added. Choose images for your product.")}</p>`;
    input.disabled = busy || entries.length >= 8;
    previews.querySelectorAll("button").forEach((button) => {
      if (busy) button.disabled = true;
    });
  }
  input.onchange = () => {
    error.textContent = "";
    const files = [...input.files];
    if (entries.length + files.length > 8) {
      error.textContent = T(
        "Un produit peut avoir jusqu’à 8 photos. Retirez une photo avant d’en ajouter d’autres.",
        "A product may have up to 8 photos. Remove a photo before adding more.",
      );
      input.value = "";
      return;
    }
    if (
      files.some(
        (file) =>
          !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
          file.size < 1 ||
          file.size > 8 * 1024 * 1024,
      )
    ) {
      error.textContent = T(
        "Choisissez des photos JPG, PNG ou WebP de 8 Mo maximum chacune.",
        "Choose JPG, PNG or WebP photos of up to 8 MB each.",
      );
      input.value = "";
      return;
    }
    for (const file of files) {
      const src = URL.createObjectURL(file);
      previewUrls.add(src);
      entries.push({ src, file });
    }
    input.value = "";
    showPreviews();
  };
  previews.onclick = (event) => {
    const button = event.target.closest("[data-photo-action]");
    if (!button || busy) return;
    const index = +button.dataset.photoIndex,
      action = button.dataset.photoAction;
    if (action === "remove") {
      const [removed] = entries.splice(index, 1);
      if (previewUrls.has(removed.src)) {
        URL.revokeObjectURL(removed.src);
        previewUrls.delete(removed.src);
      }
    } else {
      const target =
        action === "main" ? 0 : action === "previous" ? index - 1 : index + 1;
      if (target < 0 || target >= entries.length) return;
      const [entry] = entries.splice(index, 1);
      entries.splice(target, 0, entry);
    }
    showPreviews();
  };
  $("#cancel-product-edit").onclick = () => {
    photoEditorSession++;
    cleanPreviews();
    showSeller();
  };
  showPreviews();
  form.onsubmit = async (event) => {
    event.preventDefault();
    if (busy || !form.reportValidity()) return;
    busy = true;
    error.textContent = "";
    form
      .querySelectorAll("button,input,select")
      .forEach((control) => (control.disabled = true));
    const title = form.elements.title.value.trim(),
      category = form.elements.category.value,
      price = Number(form.elements.price.value),
      stock = Number(form.elements.stock.value),
      visible = form.elements.visible.checked;
    if (!title || !Number.isInteger(stock)) {
      busy = false;
      error.textContent = T(
        "Vérifiez le nom et la quantité en stock.",
        "Check the name and stock quantity.",
      );
      form
        .querySelectorAll("button,input,select")
        .forEach((control) => (control.disabled = false));
      showPreviews();
      return;
    }
    try {
      for (let index = 0; index < entries.length; index++) {
        const entry = entries[index];
        if (!entry.file) continue;
        progress.textContent =
          T("Enregistrement des photos : ", "Saving photos: ") +
          (index + 1) +
          " / " +
          entries.length;
        entry.src = await uploadProductPhoto(entry.file, draftId, sellerId);
        delete entry.file;
        if (session !== photoEditorSession || !form.isConnected) {
          cleanPreviews();
          return;
        }
      }
      if (!product && products.some((p) => p.id === draftId))
        throw Error(
          T(
            "Le catalogue a changé. Ouvrez à nouveau le formulaire pour ajouter le produit.",
            "The catalogue changed. Reopen the form to add the product.",
          ),
        );
      const images = entries.map((entry) => entry.src),
        data = {
          title,
          category,
          subcategory: form.elements.subcategory.value,
          price,
          stock,
          visible,
          approved: false,
          images,
          img: images[0] || null,
        };
      if (product) {
        const current = products.find((p) => p.id === id);
        if (!current)
          throw Error(
            T(
              "Ce produit n’est plus disponible.",
              "This product is no longer available.",
            ),
          );
        Object.assign(current, data);
      } else
        products.push({
          ...data,
          id: draftId,
          seller: sellerId,
          family: category,
          desc: T(
            "Produit proposé par le vendeur.",
            "Product offered by the seller.",
          ),
        });
      progress.textContent = T("Enregistrement du produit…", "Saving product…");
      const saved = await saveDelivery();
      if (!saved)
        throw Error(
          T(
            "Le produit n’a pas été enregistré. Vos informations et photos sont conservées ; réessayez.",
            "The product was not saved. Your details and photos have been retained; retry.",
          ),
        );
      const removed = originalPictures
        .filter((src) => !images.includes(src))
        .map(uploadedPhotoId)
        .filter(Boolean);
      for (const photoId of removed)
        fetch("/api/product-photos", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photoId }),
        }).catch(() => {});
      cleanPreviews();
      if (form.isConnected && session === photoEditorSession) showSeller();
      toast(
        T(
          "Produit et photos enregistrés · validation admin en attente.",
          "Product and photos saved · awaiting administrator approval.",
        ),
      );
    } catch (err) {
      if (form.isConnected) {
        error.textContent = err.message;
        progress.textContent = "";
      }
    } finally {
      busy = false;
      if (form.isConnected) {
        form
          .querySelectorAll("button,input,select")
          .forEach((control) => (control.disabled = false));
        showPreviews();
      }
    }
  };
};
const gallerySeller = showSeller;
showSeller = function () {
  gallerySeller();
  const panel = $("#role-content [data-dashboard-panel=catalog]");
  if (!panel) return;
  panel.querySelectorAll("[data-edit]").forEach((button) => {
    const product = products.find((p) => p.id === +button.dataset.edit),
      cell = button.closest("tr")?.querySelector("td");
    if (!product || !cell) return;
    const photos = productPictures(product);
    if (photos.length)
      cell.insertAdjacentHTML(
        "afterbegin",
        `<img class="seller-product-cover" src="${esc(photos[0])}" alt=""><small class="seller-product-photo-count">${photos.length} ${T("photo(s)", "photo(s)")}</small>`,
      );
  });
};
render();
renderOffers();
if (activeRole === "seller") showSeller();
