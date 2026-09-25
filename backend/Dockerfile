# syntax=docker/dockerfile:1

# ---------- Stage 1: build (full SDK, discarded afterwards) ----------
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Restore first, using only the project file, so Docker can cache the
# downloaded packages and skip this step when only .cs files change.
COPY src/GoalsApp.Api/GoalsApp.Api.csproj src/GoalsApp.Api/
RUN dotnet restore src/GoalsApp.Api/GoalsApp.Api.csproj

# Now bring in the source and publish a Release build.
COPY src/ src/
RUN dotnet publish src/GoalsApp.Api/GoalsApp.Api.csproj \
    --configuration Release \
    --no-restore \
    --output /app/publish

# ---------- Stage 2: runtime (small ASP.NET image, no SDK) ----------
# Debian-based image: includes tzdata/ICU, needed later for IANA time zones.
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

# Listen on 8080 inside the container (the .NET image default, made explicit).
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080

# Run as the image's built-in non-root "app" user.
USER $APP_UID

ENTRYPOINT ["dotnet", "GoalsApp.Api.dll"]
