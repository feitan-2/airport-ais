const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex justify-center items-center mt-6 gap-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-4 py-2 bg-slate-200 rounded-md disabled:opacity-50 transition-transform active:scale-95"
      >
        Назад
      </button>
      <span className="text-slate-600">Страница {currentPage} из {totalPages}</span>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-4 py-2 bg-slate-200 rounded-md disabled:opacity-50 transition-transform active:scale-95"
      >
        Вперёд
      </button>
    </div>
  );
};

export default Pagination;
