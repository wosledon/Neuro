using System;
using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using Neuro.Shared;

namespace Neuro.EntityFrameworkCore.Extensions;

public static class IQueryableExtensions
{
    public static async Task<PagedList<T>> ToPagedListAsync<T>(this IQueryable<T> source, int pageIndex, int pageSize, CancellationToken cancellationToken = default)
    {
        var count = await source.CountAsync(cancellationToken);
        var items = await source.Skip(pageIndex * pageSize).Take(pageSize).ToListAsync(cancellationToken);
        return new PagedList<T>(items, count, pageIndex, pageSize);
    }

    public static IQueryable<T> WhereIf<T>(this IQueryable<T> source, bool condition, Func<IQueryable<T>, IQueryable<T>> predicate)
    {
        if (condition)
        {
            return predicate(source);
        }

        return source;
    }

    public static IQueryable<T> OrderByIf<T>(this IQueryable<T> source, bool condition, Func<IQueryable<T>, IQueryable<T>> orderBy)
    {
        if (condition)
        {
            return orderBy(source);
        }

        return source;
    }

    public static IQueryable<T> PageBy<T>(this IQueryable<T> source, int pageIndex, int pageSize)
    {
        return source.Skip(pageIndex * pageSize).Take(pageSize);
    }

    public static IQueryable<T> WhereNotNullOrWhiteSpace<T>(this IQueryable<T> source, string? value, Func<IQueryable<T>, string, IQueryable<T>> predicate)
    {
        if (!string.IsNullOrWhiteSpace(value))
        {
            return predicate(source, value);
        }

        return source;
    }

    public static IQueryable<T> WhereNotNull<T, TValue>(this IQueryable<T> source, TValue? value, Func<IQueryable<T>, TValue, IQueryable<T>> predicate)
        where TValue : struct
    {
        if (value.HasValue)
        {
            return predicate(source, value.Value);
        }

        return source;
    }

    public static IQueryable<T> WhereNotNullOrEmpty<T, TValue>(this IQueryable<T> source, IEnumerable<TValue>? values, Func<IQueryable<T>, IEnumerable<TValue>, IQueryable<T>> predicate)
    {
        if (values != null && values.Any())
        {
            return predicate(source, values);
        }

        return source;
    }

    public static IQueryable<T> WhereIn<T, TValue>(this IQueryable<T> source, IEnumerable<TValue> values, Func<T, TValue> valueSelector)
    {
        return source.Where(e => values.Contains(valueSelector(e)));
    }

    public static IQueryable<T> WhereNotIn<T, TValue>(this IQueryable<T> source, IEnumerable<TValue> values, Func<T, TValue> valueSelector)
    {
        return source.Where(e => !values.Contains(valueSelector(e)));
    }

    public static IQueryable<T> OrderByDynamic<T>(this IQueryable<T> source, string orderByProperty, bool desc)
    {
        var command = desc ? "OrderByDescending" : "OrderBy";
        var type = typeof(T);
        var property = type.GetProperty(orderByProperty);
        if (property == null)
        {
            throw new ArgumentException($"Property '{orderByProperty}' does not exist on type '{type.Name}'");
        }
        var parameter = Expression.Parameter(type, "p");
        var propertyAccess = Expression.MakeMemberAccess(parameter, property);
        var orderByExpression = Expression.Lambda(propertyAccess, parameter);
        var resultExpression = Expression.Call(typeof(Queryable), command, new Type[] { type, property.PropertyType }, source.Expression, Expression.Quote(orderByExpression));
        return source.Provider.CreateQuery<T>(resultExpression);
    }

    public static IQueryable<T> IncludeIf<T>(this IQueryable<T> source, bool condition, Func<IQueryable<T>, IQueryable<T>> include)
    {
        if (condition)
        {
            return include(source);
        }

        return source;
    }

    public static IQueryable<T> AsNoTrackingIf<T>(this IQueryable<T> source, bool condition)
        where T : class
    {
        if (condition)
        {
            return source.AsNoTracking();
        }

        return source;
    }

    public static IQueryable<T> IgnoreQueryFiltersIf<T>(this IQueryable<T> source, bool condition)
        where T : class
    {
        if (condition)
        {
            return source.IgnoreQueryFilters();
        }

        return source;
    }

    public static IQueryable<T> TakeIf<T>(this IQueryable<T> source, bool condition, int count)
    {
        if (condition)
        {
            return source.Take(count);
        }

        return source;
    }

    public static IQueryable<T> SkipIf<T>(this IQueryable<T> source, bool condition, int count)
    {
        if (condition)
        {
            return source.Skip(count);
        }

        return source;
    }

    public static IQueryable<T> WhereStringContains<T>(this IQueryable<T> source, Func<T, string> valueSelector, string substring)
    {
        return source.Where(e => EF.Functions.Like(valueSelector(e), $"%{substring}%"));
    }

    public static IQueryable<T> WhereStringStartsWith<T>(this IQueryable<T> source, Func<T, string> valueSelector, string prefix)
    {
        return source.Where(e => EF.Functions.Like(valueSelector(e), $"{prefix}%"));
    }

    public static IQueryable<T> WhereStringEndsWith<T>(this IQueryable<T> source, Func<T, string> valueSelector, string suffix)
    {
        return source.Where(e => EF.Functions.Like(valueSelector(e), $"%{suffix}"));
    }

    public static IQueryable<T> WhereDateBetween<T>(this IQueryable<T> source, Func<T, DateTime> dateSelector, DateTime? startDate, DateTime? endDate)
    {
        if (startDate.HasValue)
        {
            source = source.Where(e => dateSelector(e) >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            source = source.Where(e => dateSelector(e) <= endDate.Value);
        }

        return source;
    }

    public static IQueryable<T> WhereDateOnlyBetween<T>(this IQueryable<T> source, Func<T, DateTime> dateSelector, DateTime? startDate, DateTime? endDate)
    {
        if (startDate.HasValue)
        {
            source = source.Where(e => dateSelector(e).Date >= startDate.Value.Date);
        }

        if (endDate.HasValue)
        {
            source = source.Where(e => dateSelector(e).Date <= endDate.Value.Date);
        }

        return source;
    }

    public static IQueryable<T> WhereNullableDateBetween<T>(this IQueryable<T> source, Func<T, DateTime?> dateSelector, DateTime? startDate, DateTime? endDate)
    {
        if (startDate.HasValue)
        {
            source = source.Where(e => dateSelector(e) >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            source = source.Where(e => dateSelector(e) <= endDate.Value);
        }

        return source;
    }
}