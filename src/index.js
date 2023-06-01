import { Notify } from 'notiflix/build/notiflix-notify-aio';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import PixabayApiService from './js/pixabay-api';
import createMarkup from './js/gallery-markup';

const refs = {
  gallery: document.querySelector('.gallery'),
  form: document.querySelector('.search-form'),
  btnMore: document.querySelector('.load-more'),
  guard: document.querySelector('.js-guard'),
};

const itemsPerPage = 40;
// refs.btnMore.hidden = true;
// измененеия
let options = {
  root: null,
  rootMargin: '300px',
  threshold: 1.0,
};
let observer = new IntersectionObserver((entieres, observer) => {
  entieres.forEach(ent => {
    if (ent.target === refs.guard && ent.isIntersecting) {
      observer.unobserve(refs.guard);
      onNextPage();
    }
  });
}, options);

const pixabayApiService = new PixabayApiService(itemsPerPage);

let lightbox = new SimpleLightbox('.gallery a');

refs.form.addEventListener('submit', onSearch);
// refs.btnMore.addEventListener('click', onNextPage);

async function onSearch(event) {
  try {
    event.preventDefault();

    // refs.btnMore.hidden = true;
    observer.unobserve(refs.guard);
    clearGalleryList();
    const {
      elements: { searchQuery },
    } = event.currentTarget;
    pixabayApiService.SearchQuery = searchQuery.value;
    const response = await pixabayApiService.fetchImages();

    const {
      data: { totalHits, hits },
    } = response;

    if (hits.length) {
      Notify.success(`Hooray! We found ${totalHits} images.`);
      addGalleryList(hits);
    } else {
      Notify.failure(
        'Sorry, there are no images maching your search query. Please try again!'
      );
      // refs.btnMore.hidden = true;
    }
  } catch (error) {
    Notify.failure(`Error with message: ${error.message} !`);
  } finally {
    refs.form.reset();
  }
}

async function onNextPage(event) {
  try {
    const response = await pixabayApiService.fetchImages();
    const {
      data: { total, hits },
    } = response;

    addGalleryList(hits);

    safeScroll();

    // if (refs.btnMore.hidden) {
    if (pixabayApiService.isLastPage()) {
      Notify.warning(
        "We're sorry, but you've reached the end of search results."
      );
    }
  } catch (error) {
    Notify.failure(`Error with message: ${error.message} !`);
  }
}

function safeScroll() {
  const { height: cardHeight } = document
    .querySelector('.gallery')
    .firstElementChild.getBoundingClientRect();

  window.scrollBy({
    top: cardHeight * 2,
    behavior: 'smooth',
  });
}

function clearGalleryList() {
  refs.gallery.innerHTML = '';
}

function addGalleryList(array) {
  refs.gallery.insertAdjacentHTML(
    'beforeend',
    array.map(createMarkup).join('')
  );
  if (pixabayApiService.isLastPage()) {
    observer.unobserve(refs.guard);
  } else {
    observer.observe(refs.guard);
  }
  // refs.btnMore.hidden = pixabayApiService.isLastPage();
  lightbox.refresh();
}
