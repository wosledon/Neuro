namespace Neuro.Shared.Dtos;

public class UserUpsertRequest
{
    public Guid? Id { get; set; }

    public string? Account { get; set; }

    /// <summary>
    /// 明文密码（创建或修改密码时提供）
    /// </summary>
    public string? Password { get; set; }

    public string? Name { get; set; }

    public string? Email { get; set; }

    public string? Phone { get; set; }

    public string? Avatar { get; set; }

    public string? Description { get; set; }

    public bool? IsSuper { get; set; }
}
