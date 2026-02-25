# RAG系统快速诊断脚本
Write-Host "=== Neuro RAG 诊断工具 ===" -ForegroundColor Cyan
Write-Host ""

# 1. 检查模型文件
Write-Host "1. 检查BERT模型文件..." -ForegroundColor Yellow
$modelPath = "src\Neuro.Vectorizer\models\bert_Opset18.onnx"
if (Test-Path $modelPath) {
    $size = (Get-Item $modelPath).Length / 1MB
    Write-Host "   ✓ 模型文件存在: $modelPath" -ForegroundColor Green
    Write-Host "   文件大小: $([math]::Round($size, 2)) MB" -ForegroundColor Gray
} else {
    Write-Host "   ✗ 模型文件不存在: $modelPath" -ForegroundColor Red
    exit 1
}

# 2. 检查运行时模型目录
Write-Host ""
Write-Host "2. 检查运行时模型目录..." -ForegroundColor Yellow
$runtimeModels = "src\Neuro.Api\bin\Debug\net10.0\models"
if (Test-Path $runtimeModels) {
    Write-Host "   ✓ 运行时models目录存在" -ForegroundColor Green
    $runtimeModelFile = Join-Path $runtimeModels "bert_Opset18.onnx"
    if (Test-Path $runtimeModelFile) {
        Write-Host "   ✓ 运行时模型文件存在" -ForegroundColor Green
    } else {
        Write-Host "   ✗ 运行时模型文件不存在！" -ForegroundColor Red
        Write-Host "   需要将模型复制到输出目录" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ✗ 运行时models目录不存在" -ForegroundColor Red
}

# 3. 检查项目配置
Write-Host ""
Write-Host "3. 检查项目配置..." -ForegroundColor Yellow
$csproj = "src\Neuro.Vectorizer\Neuro.Vectorizer.csproj"
if (Select-String -Path $csproj -Pattern "CopyToOutputDirectory" -Quiet) {
    Write-Host "   ✓ 项目配置了文件复制" -ForegroundColor Green
} else {
    Write-Host "   ⚠ 项目未配置模型文件复制到输出目录" -ForegroundColor Yellow
    Write-Host "   建议在.csproj中添加：" -ForegroundColor Gray
    Write-Host "   <ItemGroup>" -ForegroundColor Gray
    Write-Host "     <None Include=`"models\**\*`" CopyToOutputDirectory=`"PreserveNewest`" />" -ForegroundColor Gray
    Write-Host "   </ItemGroup>" -ForegroundColor Gray
}

# 4. 运行基础测试
Write-Host ""
Write-Host "4. 运行Tokenizer测试..." -ForegroundColor Yellow
$testResult = dotnet test tests\Neuro.RAG.Tests\Neuro.RAG.Tests.csproj --filter "FullyQualifiedName~TextChunker" --no-build --verbosity quiet 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ Tokenizer测试通过" -ForegroundColor Green
} else {
    Write-Host "   ✗ Tokenizer测试失败" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== 诊断完成 ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "建议操作：" -ForegroundColor Yellow
Write-Host "1. 确保模型文件复制到运行时目录" -ForegroundColor White
Write-Host "2. 在Neuro.Vectorizer.csproj中添加CopyToOutputDirectory配置" -ForegroundColor White
Write-Host "3. 验证BertTokenizerAdapter生成的token ID是否与BERT兼容" -ForegroundColor White
