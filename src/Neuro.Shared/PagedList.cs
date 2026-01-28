using System;

namespace Neuro.Shared;

public interface IPagedList
{
    int PageIndex { get; }

    int PageSize { get; }

    int TotalCount { get; }

    int TotalPages { get; }

    bool HasPreviousPage { get; }

    bool HasNextPage { get; }
}

public class PagedList<T>
    : List<T>, IPagedList
{
    public int PageIndex { get; }

    public int PageSize { get; }

    public int TotalCount { get; }

    public int TotalPages { get; }

    public bool HasPreviousPage { get; }

    public bool HasNextPage { get; }

    public PagedList(IEnumerable<T> items, int count, int pageIndex, int pageSize)
    {
        TotalCount = count;
        PageSize = pageSize;
        PageIndex = pageIndex;
        TotalPages = (int)Math.Ceiling(count / (double)pageSize);

        HasPreviousPage = PageIndex > 0;
        HasNextPage = PageIndex + 1 < TotalPages;

        AddRange(items);
    }
}
