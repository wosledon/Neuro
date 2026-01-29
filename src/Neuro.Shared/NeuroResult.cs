using System.Net;

namespace Neuro.Shared;

public class NeuroResult
{
    public HttpStatusCode Code { get; set; }

    public string Message { get; set; } = string.Empty;

    public object? Data { get; set; }

    private int _total = 0;
    public int Total
    {
        get
        {
            if (Data is IPagedList pagedList)
            {
                return pagedList.TotalCount;
            }

            return _total;
        }

        set => _total = value;
    }

    public static NeuroResult Success(object? data = null, string message = "Success", int total = 0)
    {
        return new NeuroResult
        {
            Code = HttpStatusCode.OK,
            Message = message,
            Data = data,
            Total = total
        };
    }

    public static NeuroResult Failure(string message = "Failure", HttpStatusCode code = HttpStatusCode.BadRequest)
    {
        return new NeuroResult
        {
            Code = code,
            Message = message,
            Data = null,
            Total = 0
        };
    }
}