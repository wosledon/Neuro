using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Neuro.Abstractions.Services;
using Neuro.Api.Entity;
using Neuro.Api.Hubs;
using Neuro.Api.Middlewares;
using Neuro.Api.Services;
using Neuro.EntityFrameworkCore;
using Neuro.EntityFrameworkCore.Extensions;
using Neuro.EntityFrameworkCore.Sqlite;
using Neuro.Storage;
using Neuro.Vector;
using Neuro.Vectorizer;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();


// Current user service for auditing
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();

// Auth services
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IPermissionService, PermissionService>();

// Permission & Menu sync services
builder.Services.AddScoped<IPermissionDiscoveryService, PermissionDiscoveryService>();
builder.Services.AddScoped<IMenuSyncService, MenuSyncService>();

// System monitor & Activity log services
builder.Services.AddSingleton<ISystemMonitorService, SystemMonitorService>();
builder.Services.AddScoped<IActivityLogService, ActivityLogService>();

// SignalR
builder.Services.AddSignalR();

// 系统状态实时推送后台服务
builder.Services.AddHostedService<SystemStatusBackgroundService>();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});


// JWT Authentication
var jwt = builder.Configuration.GetSection("Jwt");
var secret = jwt["Key"] ?? "replace-with-secret-for-dev";
var key = Encoding.UTF8.GetBytes(secret);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = jwt["Issuer"] ?? "neuro",
        ValidateAudience = true,
        ValidAudience = jwt["Audience"] ?? "neuro",
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateLifetime = true,
        ClockSkew = TimeSpan.FromSeconds(30)
    };
    
    // SignalR WebSocket 支持 - 从 query string 获取 token
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            if (!string.IsNullOrEmpty(accessToken))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

// Policies
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("SuperOnly", p => p.RequireClaim("is_super", "True"));
});

builder.AddSqlite<NeuroDbContext>("Data Source=neuro.db", o =>
{

});

// 注册文件存储服务
builder.Services.AddLocalFileStorage(options =>
{
    options.PathBase = Path.Combine(builder.Environment.ContentRootPath, "uploads");
});

// 注册向量存储服务
builder.Services.AddVectorStore(options =>
{
    options.ProviderName = "lockfree";
});

// 注册向量化服务
// 模型文件在编译时会复制到 Neuro.Vectorizer 的输出目录
var vectorizerModelPath = Path.Combine(
    AppContext.BaseDirectory,
    "models",
    "bert_Opset18.onnx");

builder.Services.AddVectorizer(options =>
{
    options.ModelPath = vectorizerModelPath;
});

// 注册 RAG 服务
builder.Services.AddNeuroRAG();

// 注册文档向量化后台服务
builder.Services.AddSingleton<DocumentVectorizationService>();
builder.Services.AddHostedService(provider => provider.GetRequiredService<DocumentVectorizationService>());

// 注册项目文档生成后台服务
builder.Services.AddSingleton<ProjectDocGenerationService>();
builder.Services.AddHostedService(provider => provider.GetRequiredService<ProjectDocGenerationService>());

var app = builder.Build();

// app.AutoInitDatabase<NeuroDbContext>(true);

// 预载超管账号
SeedSuperAdmin(app);

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();

    app.MapScalarApiReference();
}

app.UseMiddleware<GlobalExceptionMiddleware>();

// app.UseHttpsRedirection();
app.UseCors();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// SignalR Hubs
app.MapHub<SystemStatusHub>("/hubs/system-status");
app.MapHub<ChatHub>("/hubs/chat");
app.MapHub<ProjectDocHub>("/hubs/project-doc");

// 设置文档向量化服务引用，使控制器可以触发向量化
var docVectorizationService = app.Services.GetRequiredService<DocumentVectorizationService>();
DocumentVectorizationExtensions.SetDocumentVectorizationService(docVectorizationService);

// 设置项目文档生成服务引用，使控制器可以触发文档生成
var projectDocService = app.Services.GetRequiredService<ProjectDocGenerationService>();
ProjectDocGenerationExtensions.SetProjectDocGenerationService(projectDocService);

app.Run();

/// <summary>
/// 预载超管账号
/// </summary>
static void SeedSuperAdmin(WebApplication app)
{
    try
    {
        using var scoped = app.Services.CreateScope();
        var db = scoped.ServiceProvider.GetRequiredService<NeuroDbContext>();

        // 检查是否已存在超管账号
        if (!db.Set<User>().Any())
        {
            // 创建超管账号
            var superAdmin = new User
            {
                Id = Guid.NewGuid(),
                Account = "admin",
                Name = "超级管理员",
                Email = "admin@neuro.local",
                Phone = "",
                Avatar = "",
                Description = "系统预载超级管理员账号",
                IsSuper = true,
                IsDeleted = false,
                CreatedAt = DateTime.UtcNow,
                CreatedById = Guid.Empty,
                CreatedByName = "system",
                UpdatedAt = DateTime.UtcNow,
                UpdatedById = null,
                UpdatedByName = null,
                Password = PasswordHasher.Hash("admin")
            };

            db.Set<User>().Add(superAdmin);
            db.SaveChanges();

            Console.WriteLine("==============================================");
            Console.WriteLine("超管账号已创建成功！");
            Console.WriteLine("账号: admin");
            Console.WriteLine("密码: admin");
            Console.WriteLine("==============================================");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"预载超管账号失败: {ex.Message}");
    }
}
