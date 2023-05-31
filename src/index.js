import { Notify } from 'notiflix/build/notiflix-notify-aio';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import PixabayApiService from './js/pixabay-api';

refs = {
  gallery: document.querySelector('.gallery'),
  form: document.querySelector('.search-form'),
  btnMore: document.querySelector('.load-more'),
};

refs.btnMore.hidden = true;
const pixabayApiService = new PixabayApiService((itemsPerPage = 40));

let lightbox = new SimpleLightbox('.gallery a', {
  // captionsData: 'alt',
  // captionDelay: 250,
});

refs.form.addEventListener('submit', onSearch);
refs.btnMore.addEventListener('click', onNextPage);

async function onSearch(event) {
  try {
    event.preventDefault();
    refs.btnMore.hidden = true;
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
      refs.btnMore.hidden = true;
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
    if (refs.btnMore.hidden) {
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

  refs.btnMore.hidden = pixabayApiService.isLastPage();
  lightbox.refresh();
}

function createMarkup({
  webformatURL,
  largeImageURL,
  tags,
  likes,
  views,
  comments,
  downloads,
}) {
  return `<div class="photo-card" >
      <a href ="${largeImageURL}">
        <img src="${webformatURL}" alt="${tags}" loading="lazy" />
      </a>   
      <div class="info">
        <p class="info-item">
          <b>Likes</b>
          ${likes}
        </p>
        <p class="info-item">
          <b>Views</b>
          ${views}
        </p>
        <p class="info-item">
          <b>Comments</b>
          ${comments}
        </p>
        <p class="info-item">
          <b>Downloads</b>
          ${downloads}
        </p>
      </div>
    </div>`;
}
