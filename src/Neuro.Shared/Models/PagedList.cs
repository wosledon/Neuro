namespace Neuro.Shared;

public interface IModel
{
}

public interface ICreateModel : IModel
{
}

public interface IUpdateModel : IModel
{
    public Guid Id { get; set; }
}

public interface IViewModel : IModel
{
}

public class PagedList<T> : List<T>
    where T : class
{

}